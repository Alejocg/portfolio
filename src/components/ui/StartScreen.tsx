import { useMuseum } from "../museum/store";
import { IS_TOUCH, LOW_POWER } from "../museum/device";
import { profile, projects } from "../../data/projects";

/**
 * The title card, and the fork in the road.
 *
 * Two ways in, offered as equals rather than one buried under the other: the
 * museum, and the plain catalogue. A 3D portfolio is a delight to some visitors
 * and an obstacle to others -- a recruiter on a train wants the links, not a
 * first-person walk -- and making them ask for the flat version in small print
 * is a way of pretending that is not true.
 *
 * It doubles as the loading screen: the museum option stays disabled until the
 * scene is in, while the catalogue is offered immediately, because it needs
 * nothing that is still loading.
 */
export default function StartScreen() {
  const phase = useMuseum((s) => s.phase);
  const enter = useMuseum((s) => s.enter);
  const exitMuseum = useMuseum((s) => s.exitMuseum);
  const controlMode = useMuseum((s) => s.controlMode);
  const loaded = useMuseum((s) => s.loaded);
  const progress = useMuseum((s) => s.progress);

  if (phase !== "title") return null;

  const handleEnter = () => {
    if (!loaded) return;
    enter();
    // Pointer lock has to be requested from inside the user gesture that
    // triggered it, so this happens here rather than in an effect. There is no
    // pointer to lock on a touch device.
    if (controlMode === "pointer") {
      document.querySelector("canvas")?.requestPointerLock?.();
    }
  };

  return (
    <div className="p-safe fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-ink-950/93 backdrop-blur-md">
      <div className="flex min-h-full items-center justify-center px-5 py-10 sm:px-6">
        <div className="animate-rise w-full max-w-2xl text-center">
          <p className="text-[0.6rem] uppercase tracking-[0.32em] text-brass-400 sm:text-[0.65rem] sm:tracking-[0.4em]">
            {projects.length} works · one hall · open at all hours
          </p>

          <h1 className="mt-5 font-display text-[3.25rem] leading-[0.95] text-paper-100 sm:mt-6 sm:text-8xl">
            The {profile.name}
            <br />
            Collection
          </h1>

          <div className="hairline mx-auto mt-7 h-px w-32 sm:mt-8 sm:w-40" />

          <p className="mx-auto mt-7 max-w-md text-balance font-display text-lg leading-relaxed text-paper-300 sm:mt-8 sm:text-xl">
            The same {projects.length} projects, hung in a hall you can walk
            through. Have a look around, then head back whenever you like.
          </p>

          <div className="mt-9 grid gap-3 text-left sm:mt-10 sm:grid-cols-2 sm:gap-4">
            <button
              type="button"
              onClick={handleEnter}
              disabled={!loaded}
              aria-describedby="museum-meta"
              className="control group rounded-lg border border-brass-500/40 bg-brass-400/10 p-5 text-left transition-all duration-300 hover:border-brass-400 hover:bg-brass-400/20 disabled:cursor-wait disabled:border-ink-600 disabled:bg-transparent sm:p-6"
            >
              <span className="block text-[0.6rem] uppercase tracking-[0.22em] text-brass-400 group-disabled:text-paper-700">
                Interactive
              </span>
              <span className="mt-2 block font-display text-2xl text-paper-100 group-disabled:text-paper-700 sm:text-3xl">
                {loaded ? "Walk the museum" : "Hanging the paintings…"}
              </span>
              <span id="museum-meta" className="mt-2 block text-xs leading-relaxed text-paper-500">
                {IS_TOUCH
                  ? "A 3D gallery you explore. Drag to look, thumbstick to walk."
                  : "A 3D gallery you explore in first person. WASD to walk, mouse to look."}
                {LOW_POWER && " Heavier on this device."}
              </span>

              {!loaded && (
                <span className="mt-4 block h-px w-full overflow-hidden bg-ink-700">
                  <span
                    className="block h-full bg-brass-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={exitMuseum}
              className="control group rounded-lg border border-paper-700/40 p-5 text-left transition-all duration-300 hover:border-paper-300 hover:bg-paper-100/5 sm:p-6"
            >
              <span className="block text-[0.6rem] uppercase tracking-[0.22em] text-paper-500">
                Static
              </span>
              <span className="mt-2 block font-display text-2xl text-paper-100 sm:text-3xl">
                Back to the portfolio
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-paper-500">
                Return to the page you came from, right where you left it.
              </span>
            </button>
          </div>

          <p className="mt-7 text-[0.6rem] uppercase tracking-[0.18em] text-paper-700 sm:mt-8">
            You can leave from the menu at any time
          </p>
        </div>
      </div>
    </div>
  );
}
