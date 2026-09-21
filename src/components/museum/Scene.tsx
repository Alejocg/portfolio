import { Suspense, useEffect } from "react";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  FXAA,
  N8AO,
  Noise,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { projects } from "../../data/projects";
import Architecture from "./Architecture";
import Artwork from "./Artwork";
import Attendant from "./Attendant";
import Fixtures from "./Fixtures";
import Lighting from "./Lighting";
import Player from "./Player";
import Props from "./Props";
import { QUALITY } from "./device";
import { useMuseum } from "./store";

/**
 * Everything inside the canvas.
 *
 * Kept separate from the island root so the root stays a thin shell around the
 * <Canvas> and the DOM overlays, and so this whole tree can sit behind a single
 * Suspense boundary while textures load.
 */
/**
 * Mounts only once the sibling artwork inside this Suspense boundary has
 * finished loading, which is exactly when the museum is ready to be entered.
 */
function SignalReady() {
  const setLoaded = useMuseum((s) => s.setLoaded);
  useEffect(() => setLoaded(), [setLoaded]);
  return null;
}

/**
 * Dev-only switches for bisecting the render pipeline, e.g. `?noao&notone`.
 * Stripped from the production bundle by the import.meta.env.DEV guard.
 */
const debugFlags =
  import.meta.env.DEV && typeof location !== "undefined"
    ? new URLSearchParams(location.search)
    : new URLSearchParams();
const off = (flag: string) => debugFlags.has(flag);

export default function Scene() {
  return (
    <>
      {/* Just enough fog to give the light shafts something to sit in, and to
          keep the far corners from reading as flat black. */}
      <fogExp2 attach="fog" args={["#07070a", 0.018]} />
      <color attach="background" args={["#07070a"]} />

      <Lighting />
      <Architecture />

      <Suspense fallback={null}>
        {projects.map((project) => (
          <Artwork key={project.id} project={project} />
        ))}
        <Fixtures />
        <SignalReady />
      </Suspense>

      <Props />
      <Attendant />
      <Player />

      {/*
        The effect chain, in the order it runs.

        Order is not cosmetic here. Ambient occlusion needs the raw depth buffer,
        so it goes first. Tone mapping has to come near the end, because its job
        is to map the scene's high dynamic range down for the display -- run it
        in the renderer instead and bloom would be operating on already-clipped
        highlights. And anti-aliasing goes last: hardware MSAA cannot see the
        edges that AO and bloom introduce, which is why the context is created
        with `antialias: false` and SMAA cleans up at the end.
      */}
      <EffectComposer multisampling={0} enableNormalPass={false}>
        {/*
          Contact occlusion. The single biggest step towards the room looking
          built rather than assembled: without it nothing casts the soft dark
          seam where it meets another surface, and every object appears to hover
          a millimetre off the floor no matter how good the shadows are.
        */}
        <N8AO
          enabled={!off("noao")}
          halfRes={QUALITY.halfResAO}
          quality={QUALITY.aoQuality}
          aoRadius={1.6}
          distanceFalloff={0.9}
          intensity={2.6}
          denoiseRadius={6}
          color="#06060c"
        />

        {/*
          The threshold has to sit above 1.0, not below it.

          With tone mapping moved to the end of the chain, bloom now receives
          raw linear HDR values rather than values already compressed into
          0..1. A threshold under 1 therefore catches most of the lit room
          instead of just the highlights, and the whole image turns to smear.
          Above 1 it catches only what is genuinely brighter than white: the
          skylight, the brass, and the attendant's core.
        */}
        <Bloom
          intensity={off("nobloom") ? 0 : 0.55}
          luminanceThreshold={1.15}
          luminanceSmoothing={0.22}
          mipmapBlur
          radius={0.7}
        />

        {/* Pure garnish, and a full-screen pass. First thing to go on a phone. */}
        {QUALITY.fancyEffects ? (
          <ChromaticAberration
            offset={new THREE.Vector2(0.0006, 0.0006)}
            radialModulation
            modulationOffset={0.35}
            blendFunction={BlendFunction.NORMAL}
          />
        ) : (
          <></>
        )}

        {/*
          AgX rather than ACES. Both are filmic, but AgX desaturates as it
          approaches white instead of shifting hue, so the skylight and the
          attendant's core roll off to white cleanly instead of going pink at
          the centre. It is also Blender's default since 4.0, so anything
          authored against it will match.
        */}
        {off("notone") ? <></> : <ToneMapping mode={ToneMappingMode.AGX} />}

        <Vignette eskil={false} offset={0.2} darkness={0.8} />

        {/*
          Grain, after tone mapping, and it is not only for the look.

          This room is mostly near-black plaster under exponential fog, and a
          smooth dark gradient is exactly what an 8-bit framebuffer cannot
          store: the falloff into the far corners arrives as a stack of visible
          steps. A per-pixel dither is the standard fix -- it trades the banding
          for noise an order of magnitude finer than the bands were, which the
          eye integrates back into a smooth ramp. Additive rather than overlay
          because overlay leaves blacks untouched, and the blacks are where the
          banding is.

          The strength is deliberately near the floor of what works. A band step
          in 8-bit is 1/255, so a dither only has to be a few of those to break
          it up; anything more is read as sensor noise rather than film grain,
          and on a room this dark it reads that way long before it looks
          cinematic.
        */}
        <Noise
          premultiply={false}
          blendFunction={BlendFunction.ADD}
          opacity={off("nograin") ? 0 : 0.012}
        />

        {/*
          Anti-aliasing goes last, and which one depends on the budget. SMAA
          reads the image three times to find and reconstruct edges; FXAA makes
          one pass and blurs what looks like an edge. On a phone already paying
          for AO, bloom and a tone map, the honest trade is the cheaper pass and
          a slightly softer edge.
        */}
        {QUALITY.fancyEffects ? <SMAA /> : <FXAA />}
      </EffectComposer>

      {/* Shadows stay dynamic on purpose. Baking them once would be cheaper,
          but the attendant drifts under the skylight and the knot on the plinth
          spins, and both would be left with a shadow frozen in an old pose. */}
      <AdaptiveDpr pixelated />
      <Preload all />
    </>
  );
}
