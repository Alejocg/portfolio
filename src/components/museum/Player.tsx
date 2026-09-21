import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { COLLIDERS, PLAYER, SPAWN } from "../../data/museum";
import { INTERACTABLES } from "../../data/interactables";
import { ATTENDANT_LINES } from "../../data/dialogue";
import { resolveCollisions } from "./collision";
import { attachDesktopInput, input, resetInput } from "./input";
import { useMuseum } from "./store";

const LOOK_SPEED = 0.0022;
const PITCH_LIMIT = Math.PI / 2 - 0.08;
/** How far off-centre a piece can be and still count as "looked at". */
const FOCUS_CONE = 0.62;

/**
 * How much of the room you can see at once.
 *
 * three's `fov` is the vertical angle, which is fine until the viewport is
 * taller than it is wide. A fixed 72-degree vertical fov gives a 16:9 monitor a
 * 104-degree horizontal view and a portrait phone a 37-degree one -- the same
 * room seen through a keyhole, with the piece you are standing in front of
 * mostly off-screen. So the horizontal angle is what is held roughly constant
 * and the vertical is derived from it.
 *
 * The clamp is what stops that maths from running away at extreme aspects: a
 * portrait phone would want a 138-degree vertical fov to keep 100 across, and
 * the barrel distortion at that angle is worse than the narrow view. It lands
 * at a little over 50 degrees horizontal instead, which is playable -- and why
 * the HUD suggests turning the phone sideways.
 */
const FRAMING = { horizontalFov: 100, minFov: 60, maxFov: 92 };

/**
 * Ask for the pointer lock, and do not mind being told no.
 *
 * Chrome refuses for about a second after the visitor has released the lock
 * themselves -- which is exactly the window "Escape, then Escape again to carry
 * on" lands in -- and newer versions deliver the refusal as a rejected promise
 * rather than an exception. Neither is worth reporting: a refusal leaves them
 * with a cursor, and the click handler on the canvas asks again the moment they
 * click the room.
 */
function grabPointer(canvas: HTMLElement) {
  try {
    const asked = canvas.requestPointerLock?.() as unknown;
    if (asked instanceof Promise) asked.catch(() => {});
  } catch {
    /* refused */
  }
}

export default function Player() {
  const { camera, gl } = useThree();
  const size = useThree((state) => state.size);

  // Runs on mount and on every resize, which includes a phone being turned on
  // its side and a desktop window being dragged narrow.
  useLayoutEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    if (!perspective.isPerspectiveCamera) return;

    const aspect = size.width / Math.max(size.height, 1);
    const horizontal = THREE.MathUtils.degToRad(FRAMING.horizontalFov);
    const vertical = 2 * Math.atan(Math.tan(horizontal / 2) / aspect);

    perspective.fov = THREE.MathUtils.clamp(
      THREE.MathUtils.radToDeg(vertical),
      FRAMING.minFov,
      FRAMING.maxFov,
    );
    perspective.updateProjectionMatrix();
  }, [camera, size]);

  const yaw = useRef(SPAWN.yaw);
  const pitch = useRef(0);
  const position = useRef(new THREE.Vector3(...SPAWN.position));
  const velocity = useRef(new THREE.Vector3());
  const bob = useRef(0);
  const reducedMotion = useRef(false);

  // Scratch vectors, allocated once. Allocating inside useFrame would hand the
  // garbage collector 60 vectors a second and show up as periodic stutter.
  const forward = useRef(new THREE.Vector3());
  const toTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    return attachDesktopInput({
      isLocked: () => document.pointerLockElement === gl.domElement,
      onClose: () => {
        const s = useMuseum.getState();
        if (s.phase === "reading") s.close();
        else if (s.phase === "paused") {
          s.resume();
          grabPointer(gl.domElement);
        }
        // Releasing the lock is enough: pointerlockchange below is what puts
        // the menu up, and it is the only path that also catches the Escape
        // Chrome swallows to exit the lock itself.
        else if (document.pointerLockElement) document.exitPointerLock();
        else s.pause();
      },
      onInteract: () => {
        const s = useMuseum.getState();
        if (s.phase === "reading") {
          if (s.activeId === "attendant") s.advanceDialogue(ATTENDANT_LINES.length);
          else s.close();
        } else if (s.phase === "exploring" && s.focusId) {
          s.open(s.focusId);
        }
      },
    });
  }, [gl]);

  // Pointer lock is what turns the cursor into a head. It can only be requested
  // from a user gesture, so every click on the canvas is treated as consent.
  useEffect(() => {
    const canvas = gl.domElement;

    const onClick = () => {
      if (useMuseum.getState().phase !== "exploring") return;
      if (document.pointerLockElement !== canvas) grabPointer(canvas);
    };

    /*
     * The cursor coming back is the pause.
     *
     * Not the Escape keypress: when a page is pointer-locked, Escape is how the
     * browser itself takes the lock away, and Chrome does not deliver that
     * keydown to the page at all. Watching the lock instead catches every way
     * out -- Escape, alt-tab, clicking another window -- and each of them
     * leaves the visitor with a cursor, which is exactly when they need
     * something to click.
     */
    const onLockChange = () => {
      if (document.pointerLockElement === canvas) return;
      resetInput();
      const s = useMuseum.getState();
      if (s.controlMode === "pointer") s.pause();
    };

    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onLockChange);
    return () => {
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLockChange);
    };
  }, [gl]);

  // Reading a placard should release the mouse so the links are clickable.
  useEffect(
    () =>
      useMuseum.subscribe((state, prev) => {
        if (state.phase === "reading" && prev.phase !== "reading") {
          resetInput();
          if (document.pointerLockElement) document.exitPointerLock();
        }
      }),
    [],
  );

  useFrame((_, rawDelta) => {
    // A backgrounded tab can hand us a delta of several seconds, which would
    // teleport the visitor through a wall before the solver ever runs.
    const dt = Math.min(rawDelta, 0.05);
    // Anything that is not the gallery itself freezes the visitor: a placard
    // open in front of them, or the menu.
    const frozen = useMuseum.getState().phase !== "exploring";

    // --- look ---
    if (!frozen) {
      yaw.current -= input.look.x * LOOK_SPEED;
      pitch.current -= input.look.y * LOOK_SPEED;
      pitch.current = THREE.MathUtils.clamp(pitch.current, -PITCH_LIMIT, PITCH_LIMIT);
    }
    input.look.x = 0;
    input.look.y = 0;

    // --- move ---
    const targetSpeed = input.sprint ? PLAYER.sprint : PLAYER.speed;
    let wishX = 0;
    let wishZ = 0;

    if (!frozen && (input.move.x !== 0 || input.move.y !== 0)) {
      const sin = Math.sin(yaw.current);
      const cos = Math.cos(yaw.current);
      // The camera looks down its own -z, so world forward is (-sin, -cos).
      const fx = -sin * input.move.y + cos * input.move.x;
      const fz = -cos * input.move.y - sin * input.move.x;
      const len = Math.hypot(fx, fz) || 1;
      wishX = (fx / len) * targetSpeed;
      wishZ = (fz / len) * targetSpeed;
    }

    // Ease towards the wish velocity so starting and stopping has a little
    // weight to it rather than snapping.
    const accel = 1 - Math.pow(0.0015, dt);
    velocity.current.x += (wishX - velocity.current.x) * accel;
    velocity.current.z += (wishZ - velocity.current.z) * accel;

    const nextX = position.current.x + velocity.current.x * dt;
    const nextZ = position.current.z + velocity.current.z * dt;
    const [solvedX, solvedZ] = resolveCollisions(nextX, nextZ, PLAYER.radius, COLLIDERS);

    // If the solver moved us we hit something, so kill that component of the
    // velocity rather than letting it grind into the wall.
    if (Math.abs(solvedX - nextX) > 1e-6) velocity.current.x = 0;
    if (Math.abs(solvedZ - nextZ) > 1e-6) velocity.current.z = 0;

    position.current.x = solvedX;
    position.current.z = solvedZ;

    // --- head bob ---
    const speed = Math.hypot(velocity.current.x, velocity.current.z);
    let eye = PLAYER.eyeHeight;
    if (!reducedMotion.current) {
      bob.current += dt * speed * 1.9;
      eye += Math.sin(bob.current * 2) * Math.min(speed / PLAYER.speed, 1) * 0.045;
    }

    camera.position.set(position.current.x, eye, position.current.z);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");

    // --- what are we looking at? ---
    if (frozen) return;

    camera.getWorldDirection(forward.current);
    let bestId: string | null = null;
    let bestScore = -Infinity;

    for (const item of INTERACTABLES) {
      toTarget.current.set(
        item.position[0] - camera.position.x,
        item.position[1] - camera.position.y,
        item.position[2] - camera.position.z,
      );
      const distance = toTarget.current.length();
      if (distance > PLAYER.reach) continue;

      toTarget.current.divideScalar(distance);
      const alignment = forward.current.dot(toTarget.current);
      if (alignment < FOCUS_CONE) continue;

      // Prefer whatever is most squarely in view, then whatever is nearest.
      const score = alignment * 2 - distance / PLAYER.reach;
      if (score > bestScore) {
        bestScore = score;
        bestId = item.id;
      }
    }

    useMuseum.getState().setFocus(bestId);
  });

  return null;
}
