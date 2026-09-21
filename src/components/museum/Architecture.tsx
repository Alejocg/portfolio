import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import { HALL, SKYLIGHT, WALLS, type Box } from "../../data/museum";
import { profile } from "../../data/projects";
import {
  makeNoiseTexture,
  makeNormalTexture,
  makeSkyMaterial,
  makeStoneFloor,
  makeTextTexture,
} from "./textures";
import { QUALITY } from "./device";

const PLASTER = "#1e1e26";
const PANEL = "#191920";
const TRIM = "#0e0e13";
const BRASS = "#a08a4e";

function Wall({
  box,
  map,
  normalMap,
  normalScale,
}: {
  box: Box;
  map: THREE.Texture;
  normalMap: THREE.Texture;
  normalScale: THREE.Vector2;
}) {
  return (
    <mesh position={box.position} receiveShadow castShadow>
      <boxGeometry args={box.size} />
      <meshStandardMaterial
        color={PLASTER}
        roughness={0.95}
        metalness={0}
        roughnessMap={map}
        normalMap={normalMap}
        normalScale={normalScale}
      />
    </mesh>
  );
}

/**
 * Recessed panels set into the plaster.
 *
 * Real gallery walls are almost never flat: they carry panel mouldings, and the
 * shadow line around each one is what gives a wall scale and tells you how far
 * away it is. A single unbroken plane has no such cue, which is most of why an
 * untextured room reads as a video-game box.
 */
function WallPanels() {
  const panels = useMemo(() => {
    const out: Array<{ position: [number, number, number]; size: [number, number]; rotationY: number }> = [];
    const inset = 0.04;

    // North and south walls: panels either side of centre.
    for (const [z, rotationY] of [
      [HALL.minZ + inset, 0],
      [HALL.maxZ - inset, Math.PI],
    ] as const) {
      for (const x of [-10.6, 10.6]) {
        out.push({ position: [x, 2.6, z], size: [3.4, 3.6], rotationY });
      }
    }

    // East and west walls: one panel behind each piece, plus bookends.
    for (const [x, rotationY] of [
      [HALL.minX + inset, Math.PI / 2],
      [HALL.maxX - inset, -Math.PI / 2],
    ] as const) {
      for (const z of [-6.2, 6.4]) {
        out.push({ position: [x, 2.6, z], size: [3.2, 3.6], rotationY });
      }
    }

    return out;
  }, []);

  return (
    <>
      {panels.map((p, i) => (
        <group key={i} position={p.position} rotation={[0, p.rotationY, 0]}>
          {/* The recess: a slightly darker plane sunk into the wall. */}
          <mesh>
            <planeGeometry args={p.size} />
            <meshStandardMaterial color={PANEL} roughness={0.96} />
          </mesh>
          {/* The moulding that catches the light around it. */}
          {(
            [
              [0, p.size[1] / 2, p.size[0] + 0.1, 0.05],
              [0, -p.size[1] / 2, p.size[0] + 0.1, 0.05],
              [-p.size[0] / 2, 0, 0.05, p.size[1]],
              [p.size[0] / 2, 0, 0.05, p.size[1]],
            ] as const
          ).map(([x, y, w, h], j) => (
            <mesh key={j} position={[x, y, 0.02]}>
              <boxGeometry args={[w, h, 0.05]} />
              <meshStandardMaterial color="#2a2a34" roughness={0.6} metalness={0.25} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

/**
 * The engraved title on the far wall.
 *
 * It is a texture on a plane held a few millimetres off the plaster, lit by the
 * same spots as everything else. The faint emissive lift is what sells it as
 * cut-in lettering rather than a poster taped to the wall.
 */
function Engraving() {
  const texture = useMemo(
    () =>
      makeTextTexture({
        width: 1400,
        height: 430,
        lines: [
          {
            text: profile.fullName.toUpperCase(),
            font: '600 132px "Cormorant Garamond", Georgia, serif',
            color: "#efe8d9",
            y: 170,
            letterSpacing: "22px",
          },
          {
            text: "SELECTED WORKS",
            font: "500 40px Inter, system-ui, sans-serif",
            color: "#9a9384",
            y: 272,
            letterSpacing: "16px",
          },
          {
            text: "FOUR PIECES, ONE ROOM",
            font: "400 31px Inter, system-ui, sans-serif",
            color: "#6d6759",
            y: 362,
            letterSpacing: "9px",
          },
        ],
        rule: { y: 312, color: "rgba(170,158,135,0.35)", inset: 470 },
      }),
    [],
  );

  return (
    <mesh position={[0, 6.3, HALL.minZ + 0.05]}>
      <planeGeometry args={[8.4, 2.58]} />
      <meshStandardMaterial
        map={texture}
        transparent
        roughness={0.55}
        emissive="#c9bfa6"
        emissiveMap={texture}
        emissiveIntensity={0.32}
      />
    </mesh>
  );
}

/**
 * The glazing over the opening, with sky behind it.
 *
 * It sits just *above* the ceiling plane, and that matters. Everything else up
 * there is structure that belongs under the glass: the beams reach up to 8.47
 * and the brass kerb to 8.49, so glazing hung at the old 8.44 was a plane
 * driven straight through both of them, and each beam was sliced by a bright
 * line where the sky passed through it. At 8.52 the whole assembly reads the
 * way a roof light is actually built -- frame and beams below, glass on top.
 */
function Sky() {
  const material = useMemo(() => makeSkyMaterial(), []);
  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
  });

  const S = SKYLIGHT;
  return (
    <mesh
      material={material}
      position={[0, HALL.height + 0.02, (S.minZ + S.maxZ) / 2]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[S.maxX - S.minX, S.maxZ - S.minZ]} />
    </mesh>
  );
}

/**
 * The cornice: the moulded band where the walls meet the ceiling.
 *
 * Rooms in real buildings do not end in a sharp 90-degree crease, and that
 * crease is one of the last things that still says "box" once the walls have
 * panels and the floor has joints. Two stepped runs are enough -- the point is
 * the pair of shadow lines they throw, not the profile.
 */
function Cornice() {
  // Each run is inflated on both horizontal axes and left centred on its wall,
  // the same trick the skirting uses: half the band projects into the room and
  // the other half is buried in the plaster where nobody can see it. The four
  // runs overlap at the corners, which is what a mitre looks like anyway.
  const steps = [
    { drop: 0.2, out: 0.3, height: 0.24, color: "#23232c" },
    { drop: 0.46, out: 0.15, height: 0.22, color: "#1b1b23" },
  ];

  return (
    <>
      {steps.map((step, i) =>
        WALLS.map((w, j) => (
          <mesh
            key={`${i}-${j}`}
            position={[w.position[0], HALL.height - step.drop, w.position[2]]}
            receiveShadow
          >
            <boxGeometry
              args={[w.size[0] + step.out * 2, step.height, w.size[2] + step.out * 2]}
            />
            <meshStandardMaterial color={step.color} roughness={0.75} metalness={0.1} />
          </mesh>
        )),
      )}
    </>
  );
}

/**
 * The way in, on the wall behind you as you arrive.
 *
 * Shut, and it stays shut: there is one hall, and a door you could open would
 * be a promise the building cannot keep. What it is for is orientation -- a
 * room with an entrance has a front and a back, and a visitor who turns around
 * at the start learns which is which. It stands proud of the plaster rather
 * than being cut into it, because the wall is a solid box and a recess would
 * mean carving a hole in geometry that also does the collision.
 */
function Doorway() {
  const width = 2.1;
  const height = 3.4;

  // Everything here is a box or a cylinder, so nothing needs rotating onto the
  // wall -- it only needs to step off it. The south wall's inner face is at
  // HALL.maxZ, and the room is at smaller z, so each layer that should sit
  // closer to the visitor takes a more negative offset. Stacking them
  // largest-to-smallest is what reads as a stepped architrave.
  //
  // No collider: the wall behind it already stops the visitor at z = 8.58,
  // and the nearest part of the door is at 8.82.
  return (
    <group position={[6.6, 0, HALL.maxZ]}>
      <mesh position={[0, height / 2, -0.04]} castShadow>
        <boxGeometry args={[width + 0.44, height + 0.3, 0.08]} />
        <meshStandardMaterial color="#23232c" roughness={0.7} />
      </mesh>
      <mesh position={[0, height / 2, -0.09]} castShadow>
        <boxGeometry args={[width + 0.2, height + 0.12, 0.06]} />
        <meshPhysicalMaterial
          color={BRASS}
          metalness={0.9}
          roughness={0.3}
          anisotropy={0.6}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Two leaves, with a reveal down the middle. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 4 + 0.01), height / 2, -0.13]} castShadow>
          <boxGeometry args={[width / 2 - 0.03, height, 0.06]} />
          <meshStandardMaterial color="#16161c" roughness={0.42} metalness={0.2} />
        </mesh>
      ))}

      {/* Vertical pull handles, at the height a hand would find them. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.15, 1.15, -0.18]}>
          <cylinderGeometry args={[0.032, 0.032, 0.55, 12]} />
          <meshPhysicalMaterial color={BRASS} metalness={1} roughness={0.22} anisotropy={0.5} />
        </mesh>
      ))}

      {/* Threshold. */}
      <mesh position={[0, 0.025, -0.13]}>
        <boxGeometry args={[width + 0.2, 0.05, 0.22]} />
        <meshPhysicalMaterial color="#6d5c33" metalness={0.85} roughness={0.35} />
      </mesh>
    </group>
  );
}

/**
 * Ceiling, built around a beamed skylight.
 *
 * The slabs are laid out so the opening runs down the middle of the room, and
 * the beams crossing it are what break the daylight into separate shafts.
 */
function Ceiling({ map }: { map: THREE.Texture }) {
  const y = HALL.height;
  const S = SKYLIGHT;

  const slabs: Array<{ position: [number, number, number]; size: [number, number] }> = [
    // North and south of the opening, full width.
    {
      position: [0, y, (HALL.minZ - 0.3 + S.minZ) / 2],
      size: [26.6, Math.abs(S.minZ - (HALL.minZ - 0.3))],
    },
    {
      position: [0, y, (HALL.maxZ + 0.3 + S.maxZ) / 2],
      size: [26.6, Math.abs(HALL.maxZ + 0.3 - S.maxZ)],
    },
    // East and west of the opening.
    {
      position: [(HALL.minX - 0.3 + S.minX) / 2, y, 0],
      size: [Math.abs(S.minX - (HALL.minX - 0.3)), S.maxZ - S.minZ],
    },
    {
      position: [(HALL.maxX + 0.3 + S.maxX) / 2, y, 0],
      size: [Math.abs(HALL.maxX + 0.3 - S.maxX), S.maxZ - S.minZ],
    },
  ];

  return (
    <>
      {slabs.map((slab, i) => (
        <mesh key={i} position={slab.position} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={slab.size} />
          <meshStandardMaterial
            color={TRIM}
            roughness={1}
            roughnessMap={map}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* The glazing, and the sky behind it. */}
      <Sky />

      {/* Beams crossing the opening; these cast the ladder of shadow below. */}
      {S.beams.map((x) => (
        <mesh key={x} position={[x, y - 0.18, 0]} castShadow>
          <boxGeometry args={[S.beamWidth, 0.3, S.maxZ - S.minZ]} />
          <meshStandardMaterial color="#15151b" roughness={0.8} metalness={0.15} />
        </mesh>
      ))}

      {/*
        Brass kerb around the opening.

        Anisotropic rather than plain metal. Rolled brass is brushed along its
        length, and an anisotropic highlight is the difference between a metal
        that looks machined and one that looks like chrome paint: it smears the
        reflection along the grain instead of returning a round hotspot.
      */}
      {(
        [
          [0, S.minZ, S.maxX - S.minX + 0.5, 0.25],
          [0, S.maxZ, S.maxX - S.minX + 0.5, 0.25],
        ] as const
      ).map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, y - 0.12, z]}>
          <boxGeometry args={[w, 0.22, d]} />
          <meshPhysicalMaterial
            color={BRASS}
            metalness={0.92}
            roughness={0.28}
            anisotropy={0.7}
            envMapIntensity={1.3}
          />
        </mesh>
      ))}
    </>
  );
}

/** Skirting along the base of every wall, and a picture rail above the art. */
function Trim() {
  const runs = useMemo(() => {
    const skirting: Box[] = WALLS.map((w) => ({
      position: [w.position[0], 0.11, w.position[2]] as [number, number, number],
      size: [w.size[0] + 0.1, 0.22, w.size[2] + 0.1] as [number, number, number],
    }));

    const rail: Box[] = WALLS.map((w) => ({
      position: [w.position[0], 4.6, w.position[2]] as [number, number, number],
      size: [w.size[0] + 0.06, 0.08, w.size[2] + 0.06] as [number, number, number],
    }));

    return { skirting, rail };
  }, []);

  return (
    <>
      {runs.skirting.map((r, i) => (
        <mesh key={`s${i}`} position={r.position}>
          <boxGeometry args={r.size} />
          <meshStandardMaterial color="#0b0b0f" roughness={0.45} metalness={0.35} />
        </mesh>
      ))}
      {runs.rail.map((r, i) => (
        <mesh key={`r${i}`} position={r.position}>
          <boxGeometry args={r.size} />
          <meshPhysicalMaterial
            color="#5d5136"
            roughness={0.32}
            metalness={0.8}
            anisotropy={0.6}
            envMapIntensity={1.2}
          />
        </mesh>
      ))}
    </>
  );
}

/**
 * The floor: stone slabs, polished.
 *
 * Two materials for one surface, picked by tier. On the top tier it is a live
 * reflection probe, which is a second render of the entire room every frame and
 * by far the most expensive thing in the building. Below that the probe goes
 * and a glossy standard material takes over, lit by the same environment as
 * everything else -- still clearly polished stone, it just no longer hands the
 * walls back to you upside down.
 *
 * Both share the same joint pattern, which is what does most of the work. The
 * reflection is the luxury; the joints are the floor.
 */
function Floor() {
  const stone = useMemo(() => makeStoneFloor(512, 4), []);

  // The plane is 28x20 and the texture holds 4x4 slabs, so repeating 7x5 puts
  // the tile on a 4m grid and lands each slab on exactly one metre.
  useMemo(() => {
    for (const texture of [stone.roughness, stone.normal]) texture.repeat.set(7, 5);
  }, [stone]);

  const normalScale = useMemo(() => new THREE.Vector2(0.5, 0.5), []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[28, 20]} />
      {QUALITY.reflections ? (
        /* The blur pair is wide across and short down, so reflections smear
           vertically the way they do on real polished stone rather than
           mirroring the room back perfectly. */
        <MeshReflectorMaterial
          resolution={QUALITY.reflectorResolution}
          mixBlur={1.1}
          mixStrength={14}
          blur={[400, 100]}
          roughness={0.62}
          roughnessMap={stone.roughness}
          normalMap={stone.normal}
          normalScale={normalScale}
          depthScale={1.15}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0d0d12"
          metalness={0.62}
          mirror={0.36}
        />
      ) : (
        <meshStandardMaterial
          color="#111118"
          roughness={0.5}
          roughnessMap={stone.roughness}
          normalMap={stone.normal}
          normalScale={normalScale}
          metalness={0.5}
          envMapIntensity={1.1}
        />
      )}
    </mesh>
  );
}

export default function Architecture() {
  const noise = useMemo(() => makeNoiseTexture(256, 0.18), []);

  // Plaster tooth. Kept very shallow -- the aim is to stop the walls reflecting
  // with perfect evenness, not to make them look bumpy.
  const plasterNormal = useMemo(() => {
    const t = makeNormalTexture(256, 1.5);
    t.repeat.set(5, 5);
    return t;
  }, []);
  const wallNormalScale = useMemo(() => new THREE.Vector2(0.32, 0.32), []);

  return (
    <group>
      <Floor />

      {WALLS.map((box, i) => (
        <Wall
          key={i}
          box={box}
          map={noise}
          normalMap={plasterNormal}
          normalScale={wallNormalScale}
        />
      ))}

      <WallPanels />
      <Ceiling map={noise} />
      <Cornice />
      <Trim />
      <Doorway />
      <Engraving />
    </group>
  );
}
