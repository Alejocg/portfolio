import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import * as THREE from "three";
import Scene from "./Scene";
import { SPAWN } from "../../data/museum";
import { QUALITY } from "./device";
import { useMuseum } from "./store";

/**
 * The canvas, and everything that needs three.js to exist.
 *
 * This file is the boundary of the heavy half of the site. Museum.tsx loads it
 * lazily, so three, fiber, drei and postprocessing -- about 1.3MB of the 1.5MB
 * the island weighs -- are fetched as their own chunk while the title card is
 * already on screen, instead of before it. Nothing above this boundary may
 * import from the 3D stack, or the split quietly stops being a split.
 */

/**
 * How far through loading the scene is, republished into the museum's own
 * store.
 *
 * The title card needs this number, and drei's `useProgress` is the only thing
 * that has it -- but reading it from the title card would mean importing drei
 * there, which would drag the whole 3D stack back into the eager chunk. So it
 * is read on this side of the boundary and pushed across.
 */
function ProgressBridge() {
  const { progress } = useProgress();
  const setProgress = useMuseum((s) => s.setProgress);

  useEffect(() => setProgress(progress), [progress, setProgress]);
  return null;
}

export default function Stage() {
  return (
    <>
      <ProgressBridge />
      <Canvas
        shadows={{
          /*
           * Variance shadow maps.
           *
           * The alternative for soft shadows is drei's <SoftShadows>, which
           * patches three's `shadowmap_pars_fragment` chunk to do PCSS. That
           * patch is written against an older version of the chunk than three
           * 0.185 ships, and the result is not a subtle regression: every lit
           * material in the room loses its albedo and the scene renders as flat
           * milky grey.
           *
           * VSM gets there without touching three's internals. It blurs the
           * depth variance in its own pass, so `shadow-radius` becomes a real
           * softness control rather than a sample count, and the daylight
           * through the skylight lands with the diffuse edge daylight has.
           *
           * It also wants its depth bias left alone -- the negative bias PCF
           * needs to hide acne will punch holes in a variance map instead. See
           * `normalBias` on the sun in Lighting.
           */
          type: THREE.VSMShadowMap,
        }}
        dpr={QUALITY.dpr}
        gl={{
          // SMAA (or FXAA) in the effect chain handles edges, so the context
          // does not need to pay for MSAA as well.
          antialias: false,
          powerPreference: "high-performance",
          // Tone mapping is done at the end of the effect chain instead (see
          // Scene.tsx). Doing it here as well would map the range down twice,
          // and would hand bloom highlights that were already clipped.
          toneMapping: THREE.NoToneMapping,
        }}
        camera={{
          // A starting value only. three's `fov` is the *vertical* angle, so
          // leaving it fixed hands a portrait phone a 37-degree horizontal
          // view -- a keyhole. Player.tsx derives it from the aspect ratio on
          // every resize instead; see FRAMING there.
          fov: 68,
          near: 0.1,
          far: 90,
          position: SPAWN.position,
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </>
  );
}
