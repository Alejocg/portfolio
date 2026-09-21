/**
 * What this device can reasonably be asked to render.
 *
 * Measured once, on first import, rather than per component: none of these
 * answers change during a visit, and re-querying matchMedia inside a render is
 * a layout read nobody needs.
 *
 * The scene is the same either way -- same room, same works, same interactions.
 * What the low tier changes is how expensive each frame is. The budget is spent
 * in this order, because that is the order in which these things are missed:
 * shadows and ambient occlusion stay (without them the room reads as flat
 * cardboard), the floor's live reflection probe goes (it is a second render of
 * the entire room, by far the most expensive thing here), and the garnish
 * passes go with it. A phone that drops to 20fps is a worse experience than one
 * that renders slightly softer at 60.
 *
 * Nothing here may import from three. This module is read by the title card,
 * which is in the eager chunk; a single `import * as THREE` would pull the
 * whole 3D stack back across the split that Stage.tsx exists to make.
 */

const query = (q: string) => (typeof window === "undefined" ? false : window.matchMedia(q).matches);

export const IS_TOUCH = query("(pointer: coarse)");
export const IS_SMALL = query("(max-width: 820px)");

/** Rough core count; phones and cheap laptops report 4 or fewer. */
const CORES = typeof navigator === "undefined" ? 8 : (navigator.hardwareConcurrency ?? 8);

export const LOW_POWER = IS_TOUCH || IS_SMALL || CORES <= 4;

export const QUALITY = {
  /** Cap the pixel ratio. Retina phones will happily hand you 3. */
  dpr: LOW_POWER ? ([1, 1.5] as [number, number]) : ([1, 2] as [number, number]),

  /**
   * Shadow softness. The map type itself is chosen in Stage.tsx, where three is
   * already in scope; these are the knobs that cost frames. VSM blurs the depth
   * variance in its own pass, so a wider radius really is more blur -- and more
   * passes, which is why the low tier takes fewer samples on a smaller map.
   */
  shadowMapSize: LOW_POWER ? 1024 : 2048,
  shadowRadius: LOW_POWER ? 2.5 : 4,
  shadowBlurSamples: LOW_POWER ? 4 : 10,

  /**
   * The floor's reflection probe: a second pass over the whole room, every
   * frame. Off entirely below the top tier, where the floor falls back to a
   * glossy standard material lit by the environment instead -- still polished,
   * just no longer mirroring the walls back at you.
   */
  reflections: !LOW_POWER,
  reflectorResolution: 1024,

  dustCount: LOW_POWER ? 140 : 320,

  /** Ambient occlusion: half resolution and fewer samples on weak hardware. */
  halfResAO: LOW_POWER,
  aoQuality: (LOW_POWER ? "performance" : "high") as
    | "performance"
    | "low"
    | "medium"
    | "high"
    | "ultra",

  /** Chromatic aberration is pure garnish and costs a full-screen pass. */
  fancyEffects: !LOW_POWER,

  /**
   * Dispersion splits the attendant's glass into three refraction samples
   * instead of one. Beautiful, and three times the transmission cost.
   */
  dispersion: !LOW_POWER,
};
