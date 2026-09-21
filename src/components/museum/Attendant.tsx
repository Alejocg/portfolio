import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeGlowTexture } from "./textures";
import { QUALITY } from "./device";
import { useMuseum } from "./store";

const HOME: [number, number, number] = [0, 1.75, 0];

/**
 * The attendant: a hovering armillary that answers questions about the room.
 *
 * It replaces the usual low-poly guide figure, and not only for the modelling
 * cost. A stylised human in an otherwise plausible room is the one object a
 * viewer measures against reality, and it always loses; a machined brass-and-
 * glass object has no such reference to fail. It is also the only thing here
 * that can plausibly hover under a skylight and glow.
 */
export default function Attendant() {
  const group = useRef<THREE.Group>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const core = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const attention = useRef(0);

  // Three rings on different axes, each turning at its own rate. The ratios are
  // deliberately not simple multiples, so the arrangement takes a long time to
  // repeat and never looks like it is ticking.
  const glow = useMemo(() => makeGlowTexture(), []);

  const ringSpecs = useMemo(
    () => [
      { radius: 0.62, tube: 0.018, tilt: [0, 0, 0] as const, speed: 0.22 },
      { radius: 0.52, tube: 0.015, tilt: [Math.PI / 2.2, 0.3, 0] as const, speed: -0.31 },
      { radius: 0.72, tube: 0.012, tilt: [Math.PI / 2, 0, Math.PI / 3.1] as const, speed: 0.17 },
    ],
    [],
  );

  useFrame(({ camera, clock }, delta) => {
    const t = clock.elapsedTime;
    const state = useMuseum.getState();

    const distance = Math.hypot(camera.position.x - HOME[0], camera.position.z - HOME[2]);
    const focused = state.focusId === "attendant";
    const speaking = state.activeId === "attendant";
    const wants = speaking ? 1 : focused ? 0.75 : distance < 6 ? 0.35 : 0;
    attention.current = THREE.MathUtils.damp(attention.current, wants, 4, delta);

    if (group.current) {
      // Hover. The two sine terms have different periods so the drift never
      // settles into an obvious bob.
      group.current.position.y =
        HOME[1] + Math.sin(t * 0.7) * 0.05 + Math.sin(t * 0.31) * 0.03;
      group.current.rotation.y += delta * (0.12 + attention.current * 0.5);
    }

    rings.current.forEach((ring, i) => {
      if (!ring) return;
      const spec = ringSpecs[i];
      ring.rotation.y += delta * spec.speed * (1 + attention.current * 2.6);
      ring.rotation.x += delta * spec.speed * 0.35;
    });

    if (core.current) {
      const pulse = 1 + Math.sin(t * 2.2) * 0.02 + attention.current * 0.07;
      core.current.scale.setScalar(pulse);
    }

    if (coreMat.current) {
      // A slow idle shimmer, plus a faster flicker while it is speaking, so the
      // panel text reads as coming from this object.
      const speech = speaking ? (Math.sin(t * 9) * 0.5 + 0.5) * 0.5 : 0;
      coreMat.current.emissiveIntensity = 1.5 + attention.current * 1.6 + speech;
    }

    if (halo.current) {
      halo.current.lookAt(camera.position);
      const mat = halo.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.18 + attention.current * 0.32;
      halo.current.scale.setScalar(1 + attention.current * 0.22);
    }

    if (light.current) {
      light.current.intensity = 7 + attention.current * 11;
    }
  });

  return (
    <group ref={group} position={HOME}>
      {/*
        Glass shell. Transmission is what makes it read as glass rather than as
        a white ball: the room refracts through it.

        Dispersion is the part that makes it read as a *lens*. It samples the
        refraction three times at three indices, so the bright core inside
        fringes red and blue at the rim exactly as it would through real glass.
        It costs three transmission samples instead of one, which is why the low
        tier leaves it at zero and keeps the plain refraction.
      */}
      <mesh castShadow>
        <sphereGeometry args={[0.34, 48, 36]} />
        <meshPhysicalMaterial
          transmission={0.96}
          thickness={0.5}
          roughness={0.06}
          ior={1.52}
          dispersion={QUALITY.dispersion ? 0.4 : 0}
          clearcoat={1}
          clearcoatRoughness={0.04}
          color="#dfeaff"
          transparent
        />
      </mesh>

      {/* The light inside it. */}
      <mesh ref={core}>
        <icosahedronGeometry args={[0.17, 2]} />
        <meshStandardMaterial
          ref={coreMat}
          color="#ffd9a0"
          emissive="#ffb257"
          emissiveIntensity={1.5}
          roughness={0.35}
          toneMapped={false}
        />
      </mesh>

      {/* Brass armillary rings. */}
      {ringSpecs.map((spec, i) => (
        <mesh
          key={i}
          ref={(el) => {
            rings.current[i] = el;
          }}
          rotation={spec.tilt}
          castShadow
        >
          <torusGeometry args={[spec.radius, spec.tube, 16, 96]} />
          <meshStandardMaterial color="#c9a961" metalness={1} roughness={0.18} envMapIntensity={1.4} />
        </mesh>
      ))}

      {/* Camera-facing bloom seed. Cheaper and more controllable than asking
          the bloom pass to find the core through the glass. */}
      <mesh ref={halo}>
        <planeGeometry args={[2.6, 2.6]} />
        <meshBasicMaterial
          map={glow}
          color="#ffbe71"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <pointLight ref={light} intensity={7} distance={11} color="#ffc98a" castShadow={false} />
    </group>
  );
}
