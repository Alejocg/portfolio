import * as THREE from "three";

/**
 * Text in this scene is drawn into 2D canvases and used as textures rather than
 * rendered with troika/SDF text.
 *
 * The reason is weight: a troika `<Text>` needs its own font file shipped to the
 * client (the variable Cormorant TTF is 1.2MB), whereas a canvas can draw with
 * the woff2 the page has already downloaded for the DOM. Same glyphs, no second
 * download. The trade-off is that these textures are raster, so they are drawn
 * at generous resolution and never scaled up close.
 */

const DPR = 2;

export interface TextPlateOptions {
  width: number;
  height: number;
  background?: string;
  lines: Array<{
    text: string;
    font: string;
    color: string;
    /** Baseline offset from the top, in canvas units before DPR scaling. */
    y: number;
    align?: CanvasTextAlign;
    x?: number;
    letterSpacing?: string;
    maxWidth?: number;
    lineHeight?: number;
  }>;
  /** Optional hairline rule, useful for placards. */
  rule?: { y: number; color: string; inset?: number };
}

/** Draw a plate of text and hand back a texture ready to hang on a wall. */
export function makeTextTexture(opts: TextPlateOptions): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = opts.width * DPR;
  canvas.height = opts.height * DPR;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(DPR, DPR);

  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, opts.width, opts.height);
  } else {
    ctx.clearRect(0, 0, opts.width, opts.height);
  }

  if (opts.rule) {
    const inset = opts.rule.inset ?? 0;
    ctx.fillStyle = opts.rule.color;
    ctx.fillRect(inset, opts.rule.y, opts.width - inset * 2, 1);
  }

  for (const line of opts.lines) {
    ctx.font = line.font;
    ctx.fillStyle = line.color;
    ctx.textAlign = line.align ?? "center";
    ctx.textBaseline = "alphabetic";
    if (line.letterSpacing && "letterSpacing" in ctx) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
        line.letterSpacing;
    }

    const x = line.x ?? opts.width / 2;

    if (line.maxWidth) {
      const wrapped = wrapText(ctx, line.text, line.maxWidth);
      const lh = line.lineHeight ?? 22;
      wrapped.forEach((w, i) => ctx.fillText(w, x, line.y + i * lh));
    } else {
      ctx.fillText(line.text, x, line.y);
    }

    if ("letterSpacing" in ctx) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * A subtle value-noise texture, tiled across the walls and floor.
 *
 * Flat `meshStandardMaterial` under a hard spotlight bands badly and reads as
 * plastic. A very low-contrast roughness break-up is enough to make the plaster
 * look like a surface without shipping an image.
 */
export function makeNoiseTexture(size = 256, contrast = 0.14): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);

  for (let i = 0; i < size * size; i++) {
    // Cheap smoothed noise: average a couple of octaves of white noise so the
    // grain has some structure instead of looking like TV static.
    const coarse = Math.random();
    const fine = Math.random();
    const v = 0.5 + (coarse * 0.65 + fine * 0.35 - 0.5) * contrast;
    const c = Math.round(THREE.MathUtils.clamp(v, 0, 1) * 255);
    image.data[i * 4] = c;
    image.data[i * 4 + 1] = c;
    image.data[i * 4 + 2] = c;
    image.data[i * 4 + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

/** Radial falloff used for the fake light pools on the floor. */
export function makeGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.35)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * A tangent-space normal map derived from smoothed value noise.
 *
 * Plaster, stone and painted walls are not flat, and the giveaway on an
 * untextured interior is that every surface reflects light with the same
 * perfect evenness. A very low-amplitude normal break-up fixes that: it does
 * not read as bumpiness, it reads as the surface having a tooth.
 *
 * Built from a height field rather than random per-pixel normals, because
 * neighbouring texels have to agree for the lighting to look like a surface
 * instead of static.
 */
export function makeNormalTexture(size = 256, strength = 1.4): THREE.CanvasTexture {
  // --- height field: two octaves of bilinear-interpolated value noise ---
  const height = new Float32Array(size * size);

  const octave = (cells: number, amplitude: number) => {
    const grid = new Float32Array((cells + 1) * (cells + 1));
    for (let i = 0; i < grid.length; i++) grid[i] = Math.random();

    const step = size / cells;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = x / step;
        const gy = y / step;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const fx = gx - x0;
        const fy = gy - y0;
        // Smoothstep the interpolant so cell boundaries do not show as creases.
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);

        const i00 = grid[y0 * (cells + 1) + x0];
        const i10 = grid[y0 * (cells + 1) + x0 + 1];
        const i01 = grid[(y0 + 1) * (cells + 1) + x0];
        const i11 = grid[(y0 + 1) * (cells + 1) + x0 + 1];

        const top = i00 + (i10 - i00) * sx;
        const bottom = i01 + (i11 - i01) * sx;
        height[y * size + x] += (top + (bottom - top) * sy) * amplitude;
      }
    }
  };

  octave(16, 0.7);
  octave(64, 0.3);

  // --- height field to normals, by central difference ---
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);
  const at = (x: number, y: number) =>
    height[((y + size) % size) * size + ((x + size) % size)];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(-dx, -dy, 1);
      const i = (y * size + x) * 4;
      image.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      image.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      image.data[i + 2] = (1 / len) * 0.5 * 255 + 127.5;
      image.data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

/**
 * A laid-stone floor, as a roughness map and a matching normal map.
 *
 * The single biggest tell of a computer-generated interior is a floor that is
 * one unbroken surface. Real gallery floors are laid in slabs, and what gives
 * them away as slabs is not colour -- good stone is nearly uniform -- but the
 * grout line: a narrow band that is rougher than the polished face beside it,
 * and very slightly lower. So both maps are built from one shared pattern, the
 * roughness map to break up the reflection and the normal map to catch the
 * light along each joint.
 *
 * Per-slab jitter matters as much as the joints. Every slab taking a very
 * slightly different polish is what stops the tiling from reading as a grid,
 * because the eye finds a repeat in identical cells long before it finds one in
 * a pattern.
 */
export function makeStoneFloor(
  size = 512,
  cells = 4,
): { roughness: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
  const cell = size / cells;
  const joint = Math.max(2, Math.round(size / 170));

  // Roughness of each slab's face: polished, but not all polished the same.
  const polish = Array.from({ length: cells * cells }, () => 0.32 + Math.random() * 0.16);

  // --- the shared pattern: how far into a joint is this texel? ---
  // 0 on the polished face, 1 in the middle of a joint.
  const jointness = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Every other course is offset by half a slab, the way stone is actually
      // laid. A perfect grid of butt joints reads as bathroom tile.
      const row = Math.floor(y / cell);
      const shifted = x + (row % 2 === 1 ? cell / 2 : 0);

      const dx = Math.min(shifted % cell, cell - (shifted % cell));
      const dy = Math.min(y % cell, cell - (y % cell));
      const distance = Math.min(dx, dy);
      jointness[y * size + x] = 1 - Math.min(distance / joint, 1);
    }
  }

  // --- roughness map ---
  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext("2d")!;
  const roughImage = roughCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const row = Math.floor(y / cell);
      const shifted = x + (row % 2 === 1 ? cell / 2 : 0);
      const slab =
        (row % cells) * cells + (Math.floor(shifted / cell) % cells);

      const j = jointness[y * size + x];
      // A little grain on the face as well, or the polish is suspiciously even.
      const grain = (Math.random() - 0.5) * 0.05;
      const value = THREE.MathUtils.lerp(polish[slab] + grain, 0.95, j);

      const i = (y * size + x) * 4;
      const c = Math.round(THREE.MathUtils.clamp(value, 0, 1) * 255);
      roughImage.data[i] = c;
      roughImage.data[i + 1] = c;
      roughImage.data[i + 2] = c;
      roughImage.data[i + 3] = 255;
    }
  }
  roughCtx.putImageData(roughImage, 0, 0);

  // --- normal map, by central difference on the same pattern ---
  // The joints are the height field: slab faces flat, joints sunk.
  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = size;
  normalCanvas.height = size;
  const normalCtx = normalCanvas.getContext("2d")!;
  const normalImage = normalCtx.createImageData(size, size);
  const depth = 2.4;
  const at = (x: number, y: number) =>
    -jointness[((y + size) % size) * size + ((x + size) % size)];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * depth;
      const dy = (at(x, y + 1) - at(x, y - 1)) * depth;
      const length = Math.hypot(-dx, -dy, 1);
      const i = (y * size + x) * 4;
      normalImage.data[i] = ((-dx / length) * 0.5 + 0.5) * 255;
      normalImage.data[i + 1] = ((-dy / length) * 0.5 + 0.5) * 255;
      normalImage.data[i + 2] = (1 / length) * 0.5 * 255 + 127.5;
      normalImage.data[i + 3] = 255;
    }
  }
  normalCtx.putImageData(normalImage, 0, 0);

  const finish = (canvas: HTMLCanvasElement) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Grazing angles are the whole point on a floor, and without anisotropic
    // filtering the joints turn to mush a few metres out.
    texture.anisotropy = 8;
    return texture;
  };

  return { roughness: finish(roughCanvas), normal: finish(normalCanvas) };
}

/**
 * The sky, as seen through the skylight.
 *
 * It was a flat white rectangle, which is what a skylight looks like only in a
 * render. Real sky is a gradient -- deeper overhead, paler and warmer towards
 * the horizon -- and since this one is seen at a raking angle through beams, the
 * gradient is most of what tells you there is a world above the roof.
 *
 * Values run well above 1 on purpose. Tone mapping happens at the end of the
 * effect chain, so this stays the brightest thing in the building and is what
 * the bloom pass is thresholded to catch.
 */
export function makeSkyMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uZenith: { value: new THREE.Color("#7ea8e8") },
      uHorizon: { value: new THREE.Color("#e8f0ff") },
      uSun: { value: new THREE.Color("#fff6e2") },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uSun;
      uniform float uTime;
      varying vec2 vUv;

      // Value noise, for the haze. Cheap enough to run per pixel on a surface
      // this small, and the alternative -- a texture -- is another download.
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      void main() {
        // The gradient runs across the short axis of the opening, which is the
        // direction you actually see it change as you walk down the hall.
        float t = clamp(vUv.y, 0.0, 1.0);
        vec3 sky = mix(uHorizon, uZenith, smoothstep(0.0, 0.85, t));

        // The sun's quarter of the sky, sitting where the directional light
        // is. Written as 1 - smoothstep because GLSL leaves smoothstep
        // undefined when edge0 >= edge1.
        float sun = 1.0 - smoothstep(0.0, 0.75, distance(vUv, vec2(0.62, 0.18)));
        sky = mix(sky, uSun, sun * 0.55);

        // Thin cloud, drifting slowly. Two octaves is enough at this size.
        float drift = uTime * 0.006;
        float haze =
          noise(vUv * vec2(3.0, 6.0) + vec2(drift, 0.0)) * 0.65 +
          noise(vUv * vec2(9.0, 14.0) - vec2(drift * 1.7, 0.0)) * 0.35;
        sky = mix(sky, vec3(1.0), smoothstep(0.55, 1.0, haze) * 0.4);

        // Above 1 so it survives tone mapping as "brighter than white".
        gl_FragColor = vec4(sky * 2.35, 1.0);
      }
    `,
  });
}
