import { create } from "zustand";

/**
 * "paused" is the gallery with the cursor back.
 *
 * It is not only a menu: on a desktop, releasing the pointer lock is how a
 * visitor stops, and the browser gives them no say in it -- Escape, alt-tab and
 * switching windows all hand the cursor back whether we like it or not. Without
 * a state for that, they were left with a free cursor over a scene that had
 * quietly stopped taking their input, and nothing on screen to click.
 */
export type Phase = "title" | "exploring" | "paused" | "reading";
export type ControlMode = "pointer" | "touch";

interface MuseumState {
  phase: Phase;
  /** Which interactable is currently open in an overlay, if any. */
  activeId: string | null;
  /** Which interactable the visitor is looking at and close enough to use. */
  focusId: string | null;
  controlMode: ControlMode;
  /** Pieces the visitor has already opened, for the progress counter. */
  seen: string[];
  /** How far through the attendant's script we are. */
  dialogueLine: number;
  /**
   * Whether the visitor is outside the 3D museum, reading the static portfolio.
   * This is where everyone starts: the museum is an opt-in at the foot of the
   * page, and nothing of the 3D stack is fetched until they ask for it. The
   * island renders nothing while this is set.
   */
  exited: boolean;
  /**
   * Set once the scene's Suspense boundary resolves. This is a more honest
   * signal than the loading manager's progress, which sits at 0 when nothing
   * has registered with it yet and is indistinguishable from "not started".
   */
  loaded: boolean;
  /**
   * How far through loading the scene is, 0-100. Published here by the lazily
   * loaded Stage rather than read where it is displayed, so that the title card
   * does not have to import drei -- and with it the entire 3D stack it is
   * meant to be waiting for.
   */
  progress: number;

  enter: () => void;
  pause: () => void;
  resume: () => void;
  setLoaded: () => void;
  setProgress: (value: number) => void;
  exitMuseum: () => void;
  reenterMuseum: () => void;
  setFocus: (id: string | null) => void;
  open: (id: string) => void;
  close: () => void;
  advanceDialogue: (total: number) => void;
  setControlMode: (m: ControlMode) => void;
}

export const useMuseum = create<MuseumState>((set, get) => ({
  phase: "title",
  activeId: null,
  focusId: null,
  controlMode: "pointer",
  seen: [],
  dialogueLine: 0,
  exited: true,
  loaded: false,
  progress: 0,

  enter: () => set({ phase: "exploring" }),

  /*
   * Only ever from the gallery itself. The pointer-lock listener that calls
   * this also fires when a placard is opened and when the visitor leaves for
   * the catalogue, and neither of those wants a menu thrown over the top.
   */
  pause: () => {
    if (get().phase !== "exploring") return;
    set({ phase: "paused", focusId: null });
  },

  resume: () => {
    if (get().phase !== "paused") return;
    set({ phase: "exploring" });
  },

  setLoaded: () => set({ loaded: true }),

  setProgress: (value) => {
    if (get().progress !== value) set({ progress: value });
  },

  /*
   * State first, lock second. Releasing the lock fires pointerlockchange, which
   * is what opens the pause menu -- so leaving the phase on "exploring" while
   * that lands would put a menu up on the way out of the building.
   */
  exitMuseum: () => {
    set({ exited: true, phase: "title", activeId: null, focusId: null });
    if (document.pointerLockElement) document.exitPointerLock();
  },

  reenterMuseum: () => set({ exited: false, phase: "title" }),

  setFocus: (id) => {
    if (get().focusId !== id) set({ focusId: id });
  },

  open: (id) => {
    const { seen } = get();
    set({
      phase: "reading",
      activeId: id,
      seen: seen.includes(id) ? seen : [...seen, id],
      dialogueLine: id === "attendant" ? 0 : get().dialogueLine,
    });
  },

  close: () => set({ phase: "exploring", activeId: null }),

  advanceDialogue: (total) => {
    const next = get().dialogueLine + 1;
    if (next >= total) set({ phase: "exploring", activeId: null, dialogueLine: 0 });
    else set({ dialogueLine: next });
  },

  setControlMode: (m) => set({ controlMode: m }),
}));

// Handy while building the museum: `__museum.getState()` in the console shows
// where the visitor is looking and what they have opened. Stripped from the
// production bundle by the import.meta.env.DEV guard.
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __museum: typeof useMuseum }).__museum = useMuseum;
}
