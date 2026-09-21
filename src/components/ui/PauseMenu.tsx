import { useMuseum } from "../museum/store";
import { projects } from "../../data/projects";

/**
 * The way out, and the way back in.
 *
 * A first-person scene takes the cursor, and taking the cursor means taking
 * away every exit the browser normally provides -- there is no back button in
 * here, and the reflex for leaving a game is Escape. Before this, Escape handed
 * the cursor back and put nothing on screen: the room simply stopped responding
 * and the only exit was a small label in the corner, which is not where anyone
 * looks for one.
 *
 * So this is what the released cursor finds. It is deliberately two choices and
 * no more -- carry on, or go and read the flat catalogue -- because a pause menu
 * is a doorway and nobody wants to stand in it.
 */
export default function PauseMenu() {
  const phase = useMuseum((s) => s.phase);
  const resume = useMuseum((s) => s.resume);
  const exitMuseum = useMuseum((s) => s.exitMuseum);
  const controlMode = useMuseum((s) => s.controlMode);
  const seen = useMuseum((s) => s.seen);

  if (phase !== "paused") return null;

  const seenCount = seen.filter((id) => projects.some((p) => p.id === id)).length;
  const touch = controlMode === "touch";

  const handleResume = () => {
    resume();
    // Pointer lock can only be asked for from inside the gesture that wants
    // it, so it happens here rather than in the store or an effect. On touch
    // there is no pointer to lock and nothing to do.
    if (!touch) {
      const canvas = document.querySelector("canvas");
      try {
        const asked = canvas?.requestPointerLock?.() as unknown;
        if (asked instanceof Promise) asked.catch(() => {});
      } catch {
        /* refused this soon after the visitor released it; their next click
           on the room will ask again */
      }
    }
  };

  return (
    <div className="p-safe fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-ink-950/88 backdrop-blur-md">
      <div className="flex min-h-full items-center justify-center px-5 py-10">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-title"
          className="animate-rise w-full max-w-md text-center"
        >
          <p className="text-[0.6rem] uppercase tracking-[0.32em] text-brass-400">
            The gallery is still open
          </p>

          <h2
            id="pause-title"
            className="mt-4 font-display text-5xl leading-none text-paper-100 sm:text-6xl"
          >
            Paused
          </h2>

          <p className="mt-5 text-[0.65rem] uppercase tracking-[0.2em] text-paper-500 tabular-nums">
            <span className="text-brass-300">{String(seenCount).padStart(2, "0")}</span>
            <span className="mx-1 text-paper-700">/</span>
            {String(projects.length).padStart(2, "0")} works seen
          </p>

          <div className="hairline mx-auto mt-7 h-px w-24" />

          <div className="mt-8 grid gap-3 text-left">
            <button
              type="button"
              onClick={handleResume}
              autoFocus
              className="control rounded-lg border border-brass-500/40 bg-brass-400/10 p-5 transition-all duration-300 hover:border-brass-400 hover:bg-brass-400/20"
            >
              <span className="block font-display text-2xl text-paper-100">
                Back to the gallery
              </span>
              <span className="mt-1.5 block text-xs leading-relaxed text-paper-500">
                {touch
                  ? "Pick up where you left off."
                  : "Takes the cursor back. Escape does the same."}
              </span>
            </button>

            <button
              type="button"
              onClick={exitMuseum}
              className="control rounded-lg border border-paper-700/40 p-5 transition-all duration-300 hover:border-paper-300 hover:bg-paper-100/5"
            >
              <span className="block font-display text-2xl text-paper-100">
                Leave the museum
              </span>
              <span className="mt-1.5 block text-xs leading-relaxed text-paper-500">
                Back to the portfolio, where you left it. You can come back at any
                time.
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
