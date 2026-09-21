import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { frameSize, type Project } from "../../data/projects";
import { makeGlowTexture, makeTextTexture } from "./textures";
import { useMuseum } from "./store";

/**
 * One hung piece: canvas, frame, placard and its own spotlight.
 *
 * The whole thing is built facing +z at the origin and then rotated onto its
 * wall by the parent group, so none of the maths below has to care which wall
 * it ends up on.
 */
export default function Artwork({ project }: { project: Project }) {
  const texture = useLoader(THREE.TextureLoader, project.image);
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.MeshBasicMaterial>(null);
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);
  const focusRef = useRef(0);

  useLayoutEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
      lightRef.current.target.updateMatrixWorld();
    }
  }, []);

  // A hard-edged additive plane reads as a sheet of coloured card taped to the
  // wall. The radial falloff is what turns it into light bleeding off the frame.
  const glow = useMemo(() => makeGlowTexture(), []);

  // Width follows the screenshot's own aspect ratio, so nothing on the wall is
  // stretched. See frameSize in projects.ts.
  const [w, h] = frameSize(project);
  const border = 0.16;

  const frameGeometry = useMemo(() => {
    const outer = new THREE.Shape();
    const ow = w / 2 + border;
    const oh = h / 2 + border;
    outer.moveTo(-ow, -oh);
    outer.lineTo(ow, -oh);
    outer.lineTo(ow, oh);
    outer.lineTo(-ow, oh);
    outer.closePath();

    const opening = new THREE.Path();
    opening.moveTo(-w / 2, -h / 2);
    opening.lineTo(w / 2, -h / 2);
    opening.lineTo(w / 2, h / 2);
    opening.lineTo(-w / 2, h / 2);
    opening.closePath();
    outer.holes.push(opening);

    const geometry = new THREE.ExtrudeGeometry(outer, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.035,
      bevelSegments: 3,
      curveSegments: 1,
    });
    geometry.computeVertexNormals();
    return geometry;
  }, [w, h, border]);

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  const placard = useMemo(
    () =>
      makeTextTexture({
        width: 760,
        height: 260,
        background: "#15151a",
        lines: [
          {
            text: project.title,
            font: '600 58px "Cormorant Garamond", Georgia, serif',
            color: "#ece5d6",
            y: 78,
            letterSpacing: "2px",
          },
          {
            text: project.medium,
            font: 'italic 30px "Cormorant Garamond", Georgia, serif',
            color: "#9c9483",
            y: 140,
          },
          {
            text: "PRESS  E  TO EXAMINE",
            font: "500 24px Inter, system-ui, sans-serif",
            color: "#6f6a5e",
            y: 210,
            letterSpacing: "6px",
          },
        ],
        rule: { y: 168, color: "rgba(150,140,120,0.28)", inset: 250 },
      }),
    [project],
  );

  // The frame edge lifts and the glow swells when the visitor is close enough
  // to interact. Driven in the render loop rather than by React state so that
  // looking around does not re-render the tree.
  useFrame((_, delta) => {
    const focused = useMuseum.getState().focusId === project.id;
    const target = focused ? 1 : 0;
    focusRef.current = THREE.MathUtils.damp(focusRef.current, target, 6, delta);

    if (glowRef.current) {
      glowRef.current.opacity = 0.12 + focusRef.current * 0.5;
    }
    if (groupRef.current) {
      groupRef.current.position.z = focusRef.current * 0.045;
    }
    // The house lights drop when a piece is focused (see Lighting), so the
    // picture light has to rise to meet them -- otherwise stepping up to a
    // canvas just makes the whole room dimmer.
    if (lightRef.current) {
      lightRef.current.intensity = 24 + focusRef.current * 30;
    }
  });

  return (
    <group position={project.frame.position} rotation={[0, project.frame.rotationY, 0]}>
      <group ref={groupRef}>
        {/* The moulding: one extruded shape with a hole in it, bevelled on the
            outside. Four flat bars butted together give away the trick as soon
            as a light rakes across them, because the corners have no mitre and
            the profile has no depth to catch a highlight. */}
        <mesh geometry={frameGeometry} position={[0, 0, 0.02]} castShadow receiveShadow>
          {/* Anisotropic, so the bevel smears its highlight along the profile
              the way drawn brass does instead of returning a round hotspot. */}
          <meshPhysicalMaterial
            color="#a89055"
            metalness={0.95}
            roughness={0.22}
            anisotropy={0.65}
            envMapIntensity={1.5}
          />
        </mesh>

        {/* Backing board, so the canvas is not a floating plane. */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[w, h, 0.04]} />
          <meshStandardMaterial color="#08080b" roughness={0.9} />
        </mesh>

        {/* The work itself, with a little varnish on it. Clearcoat is what
            gives a framed print its faint sheen as you walk past. */}
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[w - 0.03, h - 0.03]} />
          <meshPhysicalMaterial
            map={texture}
            roughness={0.52}
            metalness={0.02}
            clearcoat={0.55}
            clearcoatRoughness={0.28}
          />
        </mesh>

        {/* Accent halo bled onto the wall behind the frame. */}
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[w + 2.6, h + 2.6]} />
          <meshBasicMaterial
            ref={glowRef}
            map={glow}
            color={project.accent}
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Placard, mounted to the right of the frame at reading height. */}
      <mesh position={[w / 2 + 0.55, -h / 2 + 0.12, 0.03]}>
        <planeGeometry args={[0.78, 0.27]} />
        <meshStandardMaterial map={placard} roughness={0.75} />
      </mesh>

      {/*
        Picture light: a narrow spot from above, aimed at the canvas centre.

        A spotLight aims at its `target`, which three.js leaves parented to the
        scene at the world origin. Every frame here is rotated onto a different
        wall, so the target has to be an object inside this group -- otherwise
        every light would swing round to point at the middle of the room.

        Shadows are deliberately off: these light a flat canvas on a flat wall,
        so a shadow map would cost an extra render pass each to show almost
        nothing. The skylight is the only shadow caster in the building.
      */}
      <object3D ref={targetRef} position={[0, 0, 0]} />
      <spotLight
        ref={lightRef}
        position={[0, h / 2 + 1.15, 1.5]}
        angle={0.62}
        penumbra={0.85}
        distance={9}
        intensity={24}
        color="#ffe6bd"
      />

      {/*
        And the fitting the light comes out of.
        
        A picture light with no visible source is the kind of thing you do not
        notice until you look up, and then cannot stop noticing. The shade is
        open-ended and lit from inside by an unlit emissive tube, so the lamp
        itself reads as switched on from any angle -- including from below,
        where you would otherwise be looking straight into an empty cylinder.
      */}
      <group position={[0, h / 2 + 0.34, 0]}>
        {/* The arm, leaning out over the canvas. It is long enough that its
            back end finishes inside the plaster rather than hovering a
            centimetre clear of it, which is all it takes to look unscrewed. */}
        <mesh position={[0, -0.06, 0.1]} rotation={[Math.PI / 2.6, 0, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 0.42, 10]} />
          <meshPhysicalMaterial color="#8d7742" metalness={0.95} roughness={0.3} />
        </mesh>
        {/* Shade: a half-cylinder, open towards the canvas. */}
        <mesh position={[0, 0.06, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, Math.min(w * 0.5, 1.5), 16, 1, true, 0, Math.PI]} />
          <meshPhysicalMaterial
            color="#a89055"
            metalness={0.9}
            roughness={0.26}
            anisotropy={0.6}
            side={THREE.DoubleSide}
            envMapIntensity={1.4}
          />
        </mesh>
        {/* The filament. */}
        <mesh position={[0, 0.05, 0.3]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.028, 0.028, Math.min(w * 0.5, 1.5) - 0.06, 10]} />
          <meshBasicMaterial color="#ffe2ad" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
