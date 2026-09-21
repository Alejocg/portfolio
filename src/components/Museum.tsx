import { lazy, Suspense, useEffect, useState } from "react";
import Hud from "./ui/Hud";
import Panels from "./ui/Panels";
import PauseMenu from "./ui/PauseMenu";
import StartScreen from "./ui/StartScreen";
import TouchControls from "./ui/TouchControls";
import { useMuseum } from "./museum/store";

/**
 * The 3D half, fetched as its own chunk.
 *
 * three, fiber, drei and postprocessing come to about 1.3MB of the 1.5MB this
 * island weighs, and the island is `client:only` -- so bundled together, every
 * visitor waited for the whole 3D stack to download and parse before the title
 * card could render at all, staring at the catalogue underneath in the
 * meantime. Split, the card is up almost immediately and the museum streams in
 * behind it, which is also exactly the interval the card is asking them to
 * wait through.
 *
 * The price is a rule: nothing reachable from this file's static imports may
 * touch the 3D stack. `Stage.tsx` is the only door.
 */
const loadStage = () => import("./museum/Stage");
const Stage = lazy(loadStage);

/**
 * Can this browser actually give us a 3D context?
 *
 * Asking up front, rather than leaning on R3F's own `fallback` prop, keeps the
 * failure visible: `fallback` renders in place of the canvas and swallows the
 * reason, so a scene that fails to start looks identical to one that is merely
 * slow. If this returns false the island bows out entirely and the static
 * catalogue underneath becomes the page.
 */
function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The island root: one <Canvas> plus the DOM overlays that sit on top of it.
 *
 * This is the only component Astro hydrates. Everything else on the page is
 * static HTML. It renders nothing until the visitor asks for the museum from
 * the section at the foot of the portfolio, so a visitor who never does (or
 * whose browser has no WebGL) never downloads a byte of the 3D stack.
 */
export default function Museum() {
  const [fontsReady, setFontsReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const exited = useMuseum((s) => s.exited);
  const reenter = useMuseum((s) => s.reenterMuseum);

  useEffect(() => {
    if (!hasWebGL()) setWebglFailed(true);
  }, []);

  /*
   * A context can also be taken away after it has been granted.
   *
   * Phones do this: background the tab, take a call, come back, and the driver
   * has reclaimed the GPU memory. The canvas is still there and still composited
   * -- it is simply frozen on its last frame, or black, with no error anywhere.
   * Treating it as the same outcome as never having had WebGL at all is what
   * turns that dead end into the catalogue.
   */
  useEffect(() => {
    // Capture phase, because webglcontextlost is fired at the canvas and does
    // not bubble -- but it does still travel down through the ancestors first.
    const onLost = () => setWebglFailed(true);
    window.addEventListener("webglcontextlost", onLost, true);
    return () => window.removeEventListener("webglcontextlost", onLost, true);
  }, []);

  // The static catalogue lives in normal document flow underneath this island.
  // Locking the body is what stops it scrolling behind the museum -- and it is
  // done from JS rather than CSS so that a visitor without JavaScript, or with
  // a browser that cannot give us WebGL, gets an ordinary scrollable page.
  const museumVisible = !exited && !webglFailed;

  useEffect(() => {
    document.body.classList.toggle("museum-active", museumVisible);
    return () => document.body.classList.remove("museum-active");
  }, [museumVisible]);

  // The catalogue's "walk through the museum" button is static HTML, so it has
  // no way of knowing the museum has become unavailable. Telling it leaves the
  // page with no button that does nothing when pressed.
  useEffect(() => {
    if (webglFailed) window.dispatchEvent(new CustomEvent("museum:unavailable"));
  }, [webglFailed]);

  // The portfolio's "enter the museum" button is static HTML rendered by
  // Astro, so it reaches React the only way it can: through an event.
  useEffect(() => {
    const onReenter = () => reenter();
    window.addEventListener("museum:enter", onReenter);
    return () => window.removeEventListener("museum:enter", onReenter);
  }, [reenter]);

  // Sent when a visitor hovers or focuses that button: a head start on the
  // 3D chunk, spent only on someone who is already reaching for the door.
  useEffect(() => {
    const onPrefetch = () => void loadStage().catch(() => {});
    window.addEventListener("museum:prefetch", onPrefetch, { once: true });
    return () => window.removeEventListener("museum:prefetch", onPrefetch);
  }, []);

  // Placards and the engraved wall are drawn into 2D canvases using the page's
  // webfonts. Mounting before those fonts load would bake Times New Roman into
  // the textures permanently, so the scene waits for them.
  useEffect(() => {
    let cancelled = false;
    const done = () => !cancelled && setFontsReady(true);

    if (document.fonts?.ready) {
      document.fonts.ready.then(done);
      // Never let a font that fails to arrive block the whole museum.
      const timer = setTimeout(done, 3000);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    done();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!museumVisible) return null;

  return (
    <div className="fixed inset-0 z-10">
      {fontsReady && (
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      )}

      <StartScreen />
      <Hud />
      <TouchControls />
      <Panels />
      <PauseMenu />
    </div>
  );
}
