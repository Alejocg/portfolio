import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { profile } from "../../data/projects";
import { PLAQUE_TEXT, PORTRAIT_TEXT } from "../../data/dialogue";
import { makeGlowTexture, makeTextTexture } from "./textures";
import { useMuseum } from "./store";

/**
 * The portrait on the south wall — the piece you meet when you turn around on
 * the way out.
 */
function Portrait() {
  const texture = useLoader(THREE.TextureLoader, profile.portrait);
  const glowRef = useRef<THREE.MeshBasicMaterial>(null);

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  const placard = useMemo(
    () =>
      makeTextTexture({
        width: 760,
        height: 240,
        background: "#15151a",
        lines: [
          {
            text: PORTRAIT_TEXT.title,
            font: '600 46px "Cormorant Garamond", Georgia, serif',
            color: "#ece5d6",
            y: 74,
          },
          {
            text: "Self-commissioned",
            font: 'italic 30px "Cormorant Garamond", Georgia, serif',
            color: "#9c9483",
            y: 130,
          },
          {
            text: "PRESS  E",
            font: "500 24px Inter, system-ui, sans-serif",
            color: "#6f6a5e",
            y: 196,
            letterSpacing: "6px",
          },
        ],
        rule: { y: 158, color: "rgba(150,140,120,0.28)", inset: 250 },
      }),
    [],
  );

  useFrame((_, delta) => {
    if (!glowRef.current) return;
    const focused = useMuseum.getState().focusId === "portrait";
    glowRef.current.opacity = THREE.MathUtils.damp(
      glowRef.current.opacity,
      focused ? 0.5 : 0.1,
      6,
      delta,
    );
  });

  const glow = useMemo(() => makeGlowTexture(), []);
  const size = 2.6;

  return (
    <group position={[0, 2.8, 8.94]} rotation={[0, Math.PI, 0]}>
      {(
        [
          [0, size / 2 + 0.09, size + 0.36, 0.18],
          [0, -size / 2 - 0.09, size + 0.36, 0.18],
          [-size / 2 - 0.09, 0, 0.18, size],
          [size / 2 + 0.09, 0, 0.18, size],
        ] as const
      ).map(([x, y, bw, bh], i) => (
        <mesh key={i} position={[x, y, 0.07]} castShadow>
          <boxGeometry args={[bw, bh, 0.14]} />
          <meshStandardMaterial color="#a08a4e" metalness={0.9} roughness={0.26} />
        </mesh>
      ))}

      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial map={texture} roughness={0.6} />
      </mesh>

      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[size + 2.8, size + 2.8]} />
        <meshBasicMaterial
          ref={glowRef}
          map={glow}
          color="#ffb347"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[size / 2 + 0.62, -size / 2 + 0.1, 0.03]}>
        <planeGeometry args={[0.78, 0.25]} />
        <meshStandardMaterial map={placard} roughness={0.75} />
      </mesh>

      <object3D name="portrait-light-target" />
      <spotLight
        position={[0, size / 2 + 1.2, 1.6]}
        angle={0.7}
        penumbra={0.9}
        distance={8}
        intensity={16}
        color="#ffe0b8"
      />
    </group>
  );
}

/** Visitor information, mounted by the door on the way out. */
function Plaque() {
  const texture = useMemo(
    () =>
      makeTextTexture({
        width: 900,
        height: 520,
        background: "#14141a",
        lines: [
          {
            text: PLAQUE_TEXT.title.toUpperCase(),
            font: "600 40px Inter, system-ui, sans-serif",
            color: "#d9d1c0",
            y: 84,
            letterSpacing: "8px",
          },
          {
            text: PLAQUE_TEXT.body,
            font: '400 34px "Cormorant Garamond", Georgia, serif',
            color: "#9c9483",
            y: 170,
            maxWidth: 720,
            lineHeight: 46,
          },
          {
            text: "PRESS  E  TO READ",
            font: "500 24px Inter, system-ui, sans-serif",
            color: "#6f6a5e",
            y: 452,
            letterSpacing: "6px",
          },
        ],
        rule: { y: 118, color: "rgba(150,140,120,0.3)", inset: 300 },
      }),
    [],
  );

  return (
    <group position={[-7.5, 2.1, 8.9]} rotation={[0, Math.PI, 0]}>
      <mesh>
        <planeGeometry args={[1.7, 0.98]} />
        <meshStandardMaterial map={texture} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[1.82, 1.1, 0.06]} />
        <meshStandardMaterial color="#a08a4e" metalness={0.85} roughness={0.3} />
      </mesh>
      <pointLight position={[0, 0.9, 1]} intensity={3} distance={4} color="#ffdcae" />
    </group>
  );
}

export default function Fixtures() {
  return (
    <>
      <Portrait />
      <Plaque />
    </>
  );
}
