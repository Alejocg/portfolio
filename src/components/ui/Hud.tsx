import { useMuseum } from "../museum/store";
import { byId } from "../../data/interactables";
import { projects } from "../../data/projects";

const TOTAL_PIECES = projects.length;

/**
 * The heads-up layer: reticle, interaction prompt, and how much of the
 * collection has been seen.
 *
 * It is built as two layers rather than one, and the split is not arbitrary.
 * The reticle has to sit exactly where the camera is pointing, so it is
 * measured against the full viewport; a phone's safe-area inset is deeper at
 * the top than the bottom, and centring inside it would put the crosshair a few
 * pixels above the thing you are aiming at. Everything anchored to a corner is
 * measured against the safe box instead, or it ends up under the camera housing.
 *
 * Everything is pointer-events-none except the one button, so the layer never
 * eats a drag meant for the canvas.
 */
export default function Hud() {
  const phase = useMuseum((s) => s.phase);
  const focusId = useMuseum((s) => s.focusId);
  const seen = useMuseum((s) => s.seen);
  const controlMode = useMuseum((s) => s.controlMode);
  const pause = useMuseum((s) => s.pause);

  if (phase !== "exploring") return null;

  const focus = focusId ? byId(focusId) : null;
  const seenCount = seen.filter((id) => projects.some((p) => p.id === id)).length;

  return (
    <>
      {/* Full-bleed on purpose: a vignette that stopped at the safe area would
          draw a bright rectangle around the notch. */}
      <div
        className="pointer-events-none fixed inset-0 z-20"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* --- aimed at the camera's centre --- */}
      <div className="pointer-events-none fixed inset-0 z-20 select-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className={`rounded-full border transition-all duration-300 ${
              focus
                ? "h-3 w-3 border-brass-300 bg-brass-300/30"
                : "h-1.5 w-1.5 border-paper-100/50 bg-paper-100/25"
            }`}
          />
          {focus && (
            <div className="animate-reticle absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brass-400/40" />
          )}
        </div>

        {focus && (
          <div className="animate-fade absolute left-1/2 top-[calc(50%+3.2rem)] w-[min(90vw,26rem)] -translate-x-1/2 px-4 text-center">
            <p className="font-display text-xl tracking-wide text-paper-100 drop-shadow-lg sm:text-2xl">
              {focus.label}
            </p>
            <p className="mt-1.5 flex items-center justify-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-paper-500">
              <kbd className="rounded border border-brass-500/50 bg-ink-900/80 px-1.5 py-0.5 font-sans text-brass-300">
                {controlMode === "touch" ? "TAP" : "E"}
              </kbd>
              {focus.verb}
            </p>
          </div>
        )}
      </div>

      {/* --- anchored to the corners, inside the safe box --- */}
      <div className="pointer-events-none fixed inset-safe z-30 select-none">
        {/*
          The way out, for anyone who does not think to press Escape.

          It opens the pause menu rather than leaving the building outright.
          This corner used to drop the visitor straight into the catalogue,
          which is a one-way door placed where a person's eye lands while they
          are still deciding -- and on a phone there is no Escape key, so it was
          also the only door. A menu asks first, and holds both answers.

          On a desktop it releases the cursor and lets the pointer-lock listener
          in Player raise the menu, rather than raising it here: a menu over a
          still-locked canvas would be a menu nobody could reach the buttons of.
        */}
        <button
          type="button"
          onClick={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            else pause();
          }}
          className="control pointer-events-auto absolute right-4 top-4 flex items-center gap-2 rounded border border-paper-700/40 bg-ink-950/70 px-3 py-2.5 text-[0.6rem] uppercase tracking-[0.16em] text-paper-500 backdrop-blur-sm transition-colors hover:border-paper-300 hover:text-paper-100 sm:right-6 sm:top-6"
        >
          Menu
          {controlMode === "pointer" && (
            <kbd className="rounded border border-paper-700/50 px-1 py-px font-sans text-[0.55rem] text-paper-700">
              Esc
            </kbd>
          )}
        </button>

        <div className="absolute left-4 top-4 text-[0.62rem] uppercase tracking-[0.18em] text-paper-700 sm:left-6 sm:top-6 sm:text-[0.7rem] sm:tracking-[0.22em]">
          <p className="text-paper-500">The Alejo Collection</p>
          <p className="mt-1 tabular-nums">
            <span className="text-brass-300">{String(seenCount).padStart(2, "0")}</span>
            <span className="mx-1 text-paper-700">/</span>
            {String(TOTAL_PIECES).padStart(2, "0")} viewed
          </p>
        </div>

        {controlMode === "pointer" ? (
          <div className="absolute bottom-6 left-6 hidden gap-x-4 gap-y-1 text-[0.65rem] uppercase tracking-[0.18em] text-paper-700 sm:grid sm:grid-cols-[auto_auto]">
            <Key label="WASD" /> <span>Walk</span>
            <Key label="Shift" /> <span>Hurry</span>
            <Key label="Mouse" /> <span>Look</span>
            <Key label="E" /> <span>Interact</span>
            <Key label="Esc" /> <span>Pause</span>
          </div>
        ) : (
          /*
            A nudge, only while the phone is upright.

            The camera holds its horizontal angle across aspect ratios, but a
            portrait viewport asks for a vertical fov steeper than is usable and
            gets clamped (see FRAMING in Player), so upright really is the worse
            way to see the room. Driven by the CSS orientation media query
            rather than JS, so turning the phone answers it with no re-render.

            It sits high and shows itself out after a few seconds: it belongs
            near neither thumb, and a hint that never leaves stops being a hint.
          */
          <p className="animate-hint absolute left-1/2 top-20 hidden max-w-[80vw] -translate-x-1/2 text-balance rounded-full border border-paper-700/30 bg-ink-950/70 px-4 py-2 text-center text-[0.6rem] uppercase tracking-[0.16em] text-paper-500 backdrop-blur-sm portrait:block">
            Turn your phone sideways for more of the room
          </p>
        )}
      </div>
    </>
  );
}

function Key({ label }: { label: string }) {
  return (
    <kbd className="justify-self-start rounded border border-paper-700/40 bg-ink-900/70 px-1.5 py-0.5 font-sans text-paper-500">
      {label}
    </kbd>
  );
}
