/**
 * A single mutable input snapshot, shared between the DOM event listeners and
 * the render loop.
 *
 * This deliberately sidesteps React state: the render loop reads it 60+ times a
 * second and re-rendering the component tree on every keypress would be a waste.
 * The touch UI writes into the same object, so the controller does not care
 * whether a movement came from a keyboard or a thumb.
 */
export const input = {
  /** -1..1, strafe (x) and forward (y). */
  move: { x: 0, y: 0 },
  /** Look delta accumulated since the last frame, consumed by the controller. */
  look: { x: 0, y: 0 },
  sprint: false,
  /** Edge-triggered; set by a keypress or tap and cleared once acted upon. */
  interact: false,
};

const held = new Set<string>();

function recomputeKeyboardMove() {
  const up = held.has("KeyW") || held.has("ArrowUp");
  const down = held.has("KeyS") || held.has("ArrowDown");
  const left = held.has("KeyA") || held.has("ArrowLeft");
  const right = held.has("KeyD") || held.has("ArrowRight");

  input.move.y = (up ? 1 : 0) - (down ? 1 : 0);
  input.move.x = (right ? 1 : 0) - (left ? 1 : 0);
  input.sprint = held.has("ShiftLeft") || held.has("ShiftRight");
}

export function resetInput() {
  held.clear();
  input.move.x = 0;
  input.move.y = 0;
  input.look.x = 0;
  input.look.y = 0;
  input.sprint = false;
  input.interact = false;
}

/** Wire up keyboard and mouse-look. Returns a teardown function. */
export function attachDesktopInput(opts: {
  onInteract: () => void;
  onClose: () => void;
  isLocked: () => boolean;
}) {
  const onKeyDown = (e: KeyboardEvent) => {
    // Never swallow keys while the visitor is typing or tabbing through links.
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

    if (e.code === "Escape") {
      opts.onClose();
      return;
    }
    if (e.code === "KeyE" || e.code === "Space" || e.code === "Enter") {
      if (e.code === "Space") e.preventDefault();
      input.interact = true;
      opts.onInteract();
      return;
    }
    if (!held.has(e.code)) {
      held.add(e.code);
      recomputeKeyboardMove();
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    held.delete(e.code);
    recomputeKeyboardMove();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!opts.isLocked()) return;
    input.look.x += e.movementX;
    input.look.y += e.movementY;
  };

  // Releasing pointer lock (alt-tab, Escape) must not leave keys stuck down.
  const onBlur = () => resetInput();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("blur", onBlur);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("blur", onBlur);
    resetInput();
  };
}
