import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Environment, Lightformer } from "@react-three/drei";
import { HALL, SKYLIGHT } from "../../data/museum";
import { makeGlowTexture } from "./textures";
import { QUALITY } from "./device";
import { useMuseum } from "./store";

/**
 * The daylight coming through the skylight, as visible shafts.
 *
 * Real volumetrics would mean raymarching the light. This is the cheap trick
 * instead: one slab of additive geometry per gap between the ceiling beams,
 * shaded so it is brightest where it enters and gone before it lands.
 *
 * Two things stop it looking like a solid wedge of grey. A vertical falloff,
 * and a rim term that makes the slab densest at grazing angles and clearest
 * when you look straight through it -- which is how haze actually behaves and
 * what dissolves the hard silhouette.
 */
function LightShafts() {
  const group = useRef<THREE.Group>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color("#c3dbff") },
          uStrength: { value: 0.3 },
          uTime: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vNormalW;
          varying vec3 vViewW;
          void main() {
            vUv = uv;
            vec4 world = modelMatrix * vec4(position, 1.0);
            vNormalW = normalize(mat3(modelMatrix) * normal);
            vViewW = normalize(cameraPosition - world.xyz);
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uStrength;
          uniform float uTime;
          varying vec2 vUv;
          varying vec3 vNormalW;
          varying vec3 vViewW;
          void main() {
            float vertical = pow(clamp(vUv.y, 0.0, 1.0), 1.9);
            // Soften the vertical edges of each slab so neighbouring shafts do
            // not show a seam where they meet.
            float sides = smoothstep(0.0, 0.22, vUv.x) * smoothstep(0.0, 0.22, 1.0 - vUv.x);
            float rim = 1.0 - abs(dot(normalize(vNormalW), normalize(vViewW)));
            rim = pow(clamp(rim, 0.0, 1.0), 1.25);
            // A slow drift, so the air is never completely still.
            float drift = 0.9 + 0.1 * sin(uTime * 0.35 + vUv.x * 4.0);
            gl_FragColor = vec4(uColor, vertical * sides * rim * uStrength * drift);
          }
        `,
      }),
    [],
  );

  // One slab per gap between beams, spanning the full depth of the opening.
  const slabs = useMemo(() => {
    const edges = [SKYLIGHT.minX, ...SKYLIGHT.beams, SKYLIGHT.maxX];
    const out: Array<{ x: number; width: number }> = [];
    for (let i = 0; i < edges.length - 1; i++) {
      const from = edges[i] + (i === 0 ? 0 : SKYLIGHT.beamWidth / 2);
      const to = edges[i + 1] - (i === edges.length - 2 ? 0 : SKYLIGHT.beamWidth / 2);
      out.push({ x: (from + to) / 2, width: to - from });
    }
    return out;
  }, []);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    if (group.current) {
      group.current.scale.x = 1 + Math.sin(clock.elapsedTime * 0.24) * 0.01;
    }
  });

  const height = HALL.height;
  const depth = SKYLIGHT.maxZ - SKYLIGHT.minZ;

  return (
    <group ref={group}>
      {slabs.map((slab, i) => (
        <group key={i} position={[slab.x, height / 2, 0]}>
          {/* Two crossed quads per shaft: one facing down the room, one across.
              Crossed billboards read as a volume from any angle for the price
              of two triangles apiece. */}
          <mesh material={material}>
            <planeGeometry args={[slab.width * 1.35, height]} />
          </mesh>
          <mesh material={material} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[depth * 1.1, height]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** The ladder of daylight the beams cast on the floor. */
function FloorLight() {
  const glow = useMemo(() => makeGlowTexture(), []);
  const slabs = useMemo(() => {
    const edges = [SKYLIGHT.minX, ...SKYLIGHT.beams, SKYLIGHT.maxX];
    const out: Array<{ x: number; width: number }> = [];
    for (let i = 0; i < edges.length - 1; i++) {
      out.push({
        x: (edges[i] + edges[i + 1]) / 2,
        width: edges[i + 1] - edges[i] - SKYLIGHT.beamWidth,
      });
    }
    return out;
  }, []);

  return (
    <>
      {slabs.map((slab, i) => (
        <mesh key={i} position={[slab.x, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[slab.width * 1.8, (SKYLIGHT.maxZ - SKYLIGHT.minZ) * 1.9]} />
          <meshBasicMaterial
            map={glow}
            color="#9fc4ff"
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

/**
 * The house lights.
 *
 * These dim as the visitor steps up to a piece, which is what makes examining
 * something feel like an event rather than a menu opening. The dimming is
 * driven straight from the render loop rather than React state, so it costs
 * nothing on the component tree.
 */
export default function Lighting() {
  const ambient = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const dim = useRef(0);

  useFrame((_, delta) => {
    const state = useMuseum.getState();
    // Full dim while reading, a lighter touch when merely close to a piece.
    const wants = state.phase === "reading" ? 1 : state.focusId ? 0.45 : 0;
    dim.current = THREE.MathUtils.damp(dim.current, wants, 3.5, delta);

    const k = 1 - dim.current * 0.62;
    if (ambient.current) ambient.current.intensity = 0.4 * k;
    if (hemi.current) hemi.current.intensity = 0.55 * k;
    if (sun.current) sun.current.intensity = 1.9 * k;
  });

  return (
    <>
      {/* The ceiling blocks the skylight everywhere but the opening, so the room
          needs a real ambient floor under it -- without this the corners are
          unreadable rather than moody. */}
      <ambientLight ref={ambient} intensity={0.4} color="#8f9fc4" />
      <hemisphereLight ref={hemi} args={["#a8c0e8", "#2a2118", 0.55]} />

      {/*
        Daylight, and the only shadow caster in the building -- which is what
        puts the ladder of the skylight beams on the floor.

        The shadow camera is fitted tightly to the hall rather than left at its
        default 100-unit box. Every wasted metre of that frustum is resolution
        thrown away, and it is the difference between a soft shadow edge and a
        staircase.

        `radius` and `blurSamples` are the VSM softness controls (the map type
        is set in Stage.tsx). `bias` is deliberately left at zero: a negative
        depth bias is the PCF fix for acne and punches holes in a variance map
        instead. `normalBias` offsets along the surface normal, which does the
        same job here without the peter-panning a depth bias causes where
        objects meet the floor.
      */}
      <directionalLight
        ref={sun}
        position={[3, 16, 1]}
        intensity={1.9}
        color="#e2edff"
        castShadow
        shadow-mapSize={[QUALITY.shadowMapSize, QUALITY.shadowMapSize]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={2}
        shadow-camera-far={30}
        shadow-radius={QUALITY.shadowRadius}
        shadow-blurSamples={QUALITY.shadowBlurSamples}
        shadow-bias={0}
        shadow-normalBias={0.04}
      />

      {/*
        Warm bounce off the floor, to keep the shadows from going blue.

        Aimed up from beneath the floor rather than sitting in the room as a
        point light, because bounce has a direction and no position. As a point
        light this had to be intensity 9 to still be felt at the walls, and
        inverse-square then meant the bench a metre away from it took about
        twelve times that -- the bench came out the brightest surface in a hall
        whose subject is four lit pictures, and the polished floor mirrored the
        light itself back as a bright lamp hanging in mid-air with nothing
        under it. A directional fill lands the same warmth on everything.

        No `castShadow`: the floor is between this and the room, so a shadow map
        would block the very light it is meant to be bouncing.
      */}
      <directionalLight position={[0, -1, 0]} intensity={0.45} color="#ffb987" />

      <LightShafts />
      <FloorLight />

      {/*
        Reflections for the polished floor, the brass and the attendant's glass.

        drei's `preset` environments stream an HDR from a CDN; building the
        environment out of Lightformers instead keeps the site self-contained
        and offline-capable, and puts the highlights exactly where the room
        wants them.
      */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          intensity={2.2}
          position={[0, 7, 0]}
          scale={[14, 6, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          color="#d6e6ff"
        />
        <Lightformer intensity={0.8} position={[-11, 3.5, -5]} scale={[6, 5, 1]} color="#ffd9a8" />
        <Lightformer intensity={0.8} position={[11, 3.5, -5]} scale={[6, 5, 1]} color="#ffcb96" />
        <Lightformer intensity={0.35} position={[0, 1.5, 9]} scale={[14, 3, 1]} color="#49597e" />
      </Environment>
    </>
  );
}
