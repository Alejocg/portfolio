import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMuseum } from "./store";
import { QUALITY } from "./device";

/** A gallery bench: slatted seat on two blade legs. */
/**
 * A slatted bench.
 *
 * The wood is much darker than a bench usually is, and on purpose: the one in
 * this hall stands a little over a metre from where the visitor spawns, so on a
 * portrait phone -- where the vertical fov is at its widest -- its four slats
 * are the whole bottom third of the opening shot. At any ordinary furniture
 * albedo that makes the brightest, largest surface on screen a bench, in a room
 * whose subject is four lit pictures. Dark walnut keeps it as the foreground it
 * is meant to be.
 */
function Bench({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const slats = [-0.42, -0.14, 0.14, 0.42];

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {slats.map((z) => (
        <mesh key={z} position={[0, 0.46, z]} castShadow receiveShadow>
          <boxGeometry args={[2.7, 0.09, 0.24]} />
          <meshStandardMaterial
            color="#3a2b1e"
            roughness={0.62}
            metalness={0.05}
            envMapIntensity={0.55}
          />
        </mesh>
      ))}
      {[-1.05, 1.05].map((x) => (
        <mesh key={x} position={[x, 0.22, 0]} castShadow>
          <boxGeometry args={[0.1, 0.44, 1.05]} />
          <meshStandardMaterial color="#1a1a1f" roughness={0.3} metalness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * A potted plant, grown procedurally.
 *
 * Each leaf is a lathed blade bent along its length and then splayed around the
 * stem with a bit of jitter, so no two plants in the building are identical
 * without a single model file being downloaded.
 */
function Plant({ position, seed = 1 }: { position: [number, number, number]; seed?: number }) {
  const leaves = useMemo(() => {
    // A tiny deterministic PRNG keeps the arrangement stable across re-renders
    // while still differing from planter to planter.
    let s = seed * 9301;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    return Array.from({ length: 11 }, (_, i) => {
      const angle = (i / 11) * Math.PI * 2 + rand() * 0.5;
      const lean = 0.35 + rand() * 0.55;
      const height = 0.75 + rand() * 0.75;
      const scale = 0.55 + rand() * 0.5;
      return { angle, lean, height, scale };
    });
  }, [seed]);

  const leafGeometry = useMemo(() => {
    // Half a leaf profile, revolved into a blade shape.
    const points = Array.from({ length: 12 }, (_, i) => {
      const t = i / 11;
      const width = Math.sin(t * Math.PI) * 0.16 + 0.01;
      return new THREE.Vector2(width, t * 0.62);
    });
    return new THREE.LatheGeometry(points, 6);
  }, []);

  return (
    <group position={position}>
      {/* Planter */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.32, 0.6, 20]} />
        <meshStandardMaterial color="#26262e" roughness={0.85} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.06, 20]} />
        <meshStandardMaterial color="#15150f" roughness={1} />
      </mesh>

      {leaves.map((leaf, i) => (
        <group key={i} rotation={[0, leaf.angle, 0]}>
          <group rotation={[leaf.lean, 0, 0]} position={[0, 0.62, 0]}>
            <mesh
              geometry={leafGeometry}
              position={[0, leaf.height * 0.3, 0]}
              scale={[leaf.scale, leaf.height, leaf.scale * 0.35]}
              castShadow
            >
              <meshStandardMaterial color="#2f6b3f" roughness={0.62} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

/**
 * The plinth on the east side of the hall, and the object turning on it.
 *
 * The knot doubles as the "Toolkit" exhibit — walking up to it and pressing E
 * opens the skills panel.
 */
function Plinth() {
  const knotRef = useRef<THREE.Mesh>(null);
  const focusRef = useRef(0);

  useFrame((state, delta) => {
    if (!knotRef.current) return;
    const focused = useMuseum.getState().focusId === "plinth";
    focusRef.current = THREE.MathUtils.damp(focusRef.current, focused ? 1 : 0, 5, delta);

    knotRef.current.rotation.y += delta * (0.25 + focusRef.current * 0.55);
    knotRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.14;
    knotRef.current.position.y =
      1.72 + Math.sin(state.clock.elapsedTime * 0.8) * 0.05 + focusRef.current * 0.06;
  });

  return (
    <group position={[8.5, 0, 4]}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 1.2, 1.1]} />
        <meshStandardMaterial color="#191920" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.21, 0]}>
        <boxGeometry args={[1.24, 0.04, 1.24]} />
        <meshStandardMaterial color="#a08a4e" metalness={0.9} roughness={0.25} />
      </mesh>

      <mesh ref={knotRef} position={[0, 1.72, 0]} castShadow>
        <torusKnotGeometry args={[0.28, 0.085, 160, 24, 2, 3]} />
        <meshStandardMaterial
          color="#d8b25e"
          metalness={1}
          roughness={0.14}
          emissive="#4a3410"
          emissiveIntensity={0.5}
        />
      </mesh>

      <pointLight position={[0, 2.3, 0]} intensity={5} distance={4.5} color="#ffca7a" />
    </group>
  );
}

/**
 * Floating motes, dense in the skylight shafts and sparse elsewhere.
 *
 * The whole animation lives in the vertex shader. The obvious version keeps the
 * positions in a Float32Array, walks it on the CPU each frame and re-uploads
 * the buffer -- which means a few hundred writes and a full attribute upload
 * sixty times a second, for motion that is one subtraction per mote. Here each
 * mote carries its own speed and phase, and the shader derives where it is from
 * the clock, so the geometry is uploaded exactly once and never touched again.
 *
 * `mod` is what recycles them: a mote that falls past the floor reappears at
 * the ceiling with no branch and no bookkeeping.
 *
 * The fragment shader matters as much. A default points material draws squares,
 * and dust in a light shaft that is visibly square is worse than no dust; a
 * radial falloff turns each one back into a speck.
 */
function Dust({ count = QUALITY.dustCount }: { count?: number }) {
  const CEILING = 8;

  const geometry = useMemo(() => {
    const position = new Float32Array(count * 3);
    const motion = new Float32Array(count * 3); // speed, phase, size
    const shaft = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Three quarters of the motes live in the shafts, where the light will
      // actually catch them; the rest drift so the air is never empty.
      const inShaft = i % 4 !== 0;
      if (inShaft) {
        position[i * 3] = -8 + Math.random() * 16;
        position[i * 3 + 2] = -2.6 + Math.random() * 5.2;
      } else {
        position[i * 3] = -12 + Math.random() * 24;
        position[i * 3 + 2] = -8 + Math.random() * 16;
      }
      position[i * 3 + 1] = Math.random() * CEILING;

      motion[i * 3] = 0.04 + Math.random() * 0.12; // fall speed, m/s
      motion[i * 3 + 1] = Math.random() * Math.PI * 2; // sway phase
      motion[i * 3 + 2] = 0.02 + Math.random() * 0.022; // size, in metres
      shaft[i] = inShaft ? 1 : 0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geometry.setAttribute("aMotion", new THREE.BufferAttribute(motion, 3));
    geometry.setAttribute("aShaft", new THREE.BufferAttribute(shaft, 1));
    return geometry;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uCeiling: { value: CEILING },
          /**
           * Half the drawing buffer height, which is the constant three itself
           * uses for size attenuation -- so `aMotion.z` is a radius in metres
           * and a mote is the same physical size at any resolution.
           */
          uScale: { value: 500 },
          uColor: { value: new THREE.Color("#ffeccd") },
        },
        vertexShader: /* glsl */ `
          uniform float uTime;
          uniform float uCeiling;
          uniform float uScale;
          attribute vec3 aMotion;
          attribute float aShaft;
          varying float vBrightness;

          void main() {
            float speed = aMotion.x;
            float phase = aMotion.y;
            float size = aMotion.z;

            vec3 p = position;
            // Fall, and wrap back to the ceiling. No branch, no readback.
            p.y = mod(p.y - uTime * speed - 0.05, uCeiling) + 0.05;
            // A slow sway, so nothing falls dead straight.
            p.x += sin(uTime * 0.3 + phase) * 0.16;
            p.z += cos(uTime * 0.22 + phase) * 0.12;

            vec4 view = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * view;
            gl_PointSize = size * uScale / max(-view.z, 0.1);

            // Motes outside the shafts are lit by the room, not the sun, so
            // they stay dim. The two fades are what hide the recycling: one as
            // a mote settles towards the floor, and one as it reappears at the
            // ceiling -- without the second, every mote pops back into
            // existence at full brightness the instant it wraps.
            float lit = mix(0.35, 1.0, aShaft);
            float settling = smoothstep(0.0, 1.4, p.y);
            float arriving = 1.0 - smoothstep(uCeiling - 1.6, uCeiling, p.y);
            float twinkle = 0.75 + 0.25 * sin(uTime * 1.7 + phase * 3.0);
            vBrightness = lit * settling * arriving * twinkle;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vBrightness;
          void main() {
            // Radial falloff: a speck, not a square. Written as 1 - smoothstep
            // rather than with the edges swapped, because GLSL leaves
            // smoothstep undefined when edge0 >= edge1 and drivers disagree
            // about what to do with it.
            float d = length(gl_PointCoord - 0.5);
            float alpha = 1.0 - smoothstep(0.06, 0.5, d);
            gl_FragColor = vec4(uColor, alpha * vBrightness * 0.42);
          }
        `,
      }),
    [],
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uScale.value = (state.size.height * state.viewport.dpr) / 2;
  });

  // Culling is off because the shader moves the motes and the bounding sphere
  // does not know it: three would compute the box from their starting
  // positions and then cull the whole cloud as soon as they had drifted.
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

export default function Props() {
  return (
    <group>
      <Bench position={[0, 0, 6.2]} />
      <Plinth />
      <Dust />

      <Plant position={[-11.4, 0, -7.4]} seed={1} />
      <Plant position={[11.4, 0, -7.4]} seed={2} />
      <Plant position={[-11.4, 0, 7.4]} seed={3} />
      <Plant position={[11.4, 0, 7.4]} seed={4} />
    </group>
  );
}
