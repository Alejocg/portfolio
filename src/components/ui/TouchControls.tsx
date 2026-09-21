import { useEffect, useRef, useState } from "react";
import { input } from "../museum/input";
import { useMuseum } from "../museum/store";
import { byId } from "../../data/interactables";

/** How far the knob travels before the stick is at full deflection. */
const STICK_RADIUS = 54;

/**
 * A dead zone, in pixels.
 *
 * A thumb resting on a virtual stick is never still, and without this the
 * visitor drifts a few centimetres a second while standing and reading a
 * placard. Small enough that it is not felt as slack.
 */
const DEAD_ZONE = 7;

/**
 * Touch controls: a virtual stick on the left, drag-to-look everywhere else.
 *
 * Pointer lock does not exist on phones, so on a coarse pointer the same input
 * object is driven by touches instead. Both halves write into `input` exactly
 * as the keyboard and mouse do, so the controller upstream is unaware of which
 * is in use.
 *
 * The stick is tracked in absolute coordinates from wherever the thumb first
 * landed, not from the centre of the ring -- so a thumb that comes down on the
 * edge of the pad does not snap the visitor into a sprint. The ring is only
 * there to say where the pad is.
 */
export default function TouchControls() {
  const phase = useMuseum((s) => s.phase);
  const controlMode = useMuseum((s) => s.controlMode);
  const setControlMode = useMuseum((s) => s.setControlMode);
  const focusId = useMuseum((s) => s.focusId);

  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);
  const stickOrigin = useRef<{ x: number; y: number } | null>(null);
  const stickPointer = useRef<number | null>(null);
  const lookPointer = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) setControlMode("touch");
  }, [setControlMode]);

  // Walking has to stop when the overlay opens, or the visitor carries on into
  // a wall behind the panel they are reading and the stick comes back centred
  // over a thumb that never lifted.
  useEffect(() => {
    if (phase === "exploring") return;
    stickPointer.current = null;
    stickOrigin.current = null;
    lookPointer.current = null;
    setKnob(null);
    input.move.x = 0;
    input.move.y = 0;
  }, [phase]);

  if (controlMode !== "touch" || phase !== "exploring") return null;

  const onStickDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    stickPointer.current = e.pointerId;
    stickOrigin.current = { x: e.clientX, y: e.clientY };
    setKnob({ x: 0, y: 0 });
  };

  const onStickMove = (e: React.PointerEvent) => {
    if (stickPointer.current !== e.pointerId || !stickOrigin.current) return;
    const dx = e.clientX - stickOrigin.current.x;
    const dy = e.clientY - stickOrigin.current.y;
    const distance = Math.hypot(dx, dy);

    if (distance < DEAD_ZONE) {
      setKnob({ x: 0, y: 0 });
      input.move.x = 0;
      input.move.y = 0;
      return;
    }

    const clamped = Math.min(distance, STICK_RADIUS);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clamped;
    const ky = Math.sin(angle) * clamped;
    setKnob({ x: kx, y: ky });

    // Rescaled past the dead zone so the first millimetre of real movement is
    // a slow walk rather than a jump to a fifth of full speed.
    const throttle = (clamped - DEAD_ZONE) / (STICK_RADIUS - DEAD_ZONE);
    input.move.x = Math.cos(angle) * throttle;
    input.move.y = -Math.sin(angle) * throttle;
  };

  const onStickUp = () => {
    stickPointer.current = null;
    stickOrigin.current = null;
    setKnob(null);
    input.move.x = 0;
    input.move.y = 0;
  };

  const onLookDown = (e: React.PointerEvent) => {
    // One finger looks. A second is either the stick or a stray palm, and
    // letting it through makes the view lurch between two thumbs.
    if (lookPointer.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    lookPointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };

  const onLookMove = (e: React.PointerEvent) => {
    const look = lookPointer.current;
    if (!look || look.id !== e.pointerId) return;
    // Touch dragging feels right at roughly twice the sensitivity of a mouse,
    // because a thumb has a couple of centimetres to work with and a mouse has
    // the whole desk.
    input.look.x += (e.clientX - look.x) * 1.9;
    input.look.y += (e.clientY - look.y) * 1.9;
    look.x = e.clientX;
    look.y = e.clientY;
  };

  const onLookUp = (e: React.PointerEvent) => {
    if (lookPointer.current?.id === e.pointerId) lookPointer.current = null;
  };

  const interact = () => {
    const s = useMuseum.getState();
    if (s.focusId) s.open(s.focusId);
  };

  return (
    <>
      {/*
        The look area, full-bleed and underneath everything else. It has to
        reach the edges of the glass -- a drag that dies at the safe-area inset
        feels like the screen is sticky.
      */}
      <div
        className="control fixed inset-0 z-20 touch-none"
        onPointerDown={onLookDown}
        onPointerMove={onLookMove}
        onPointerUp={onLookUp}
        onPointerCancel={onLookUp}
      />

      {/* The controls themselves, inset past the home indicator. */}
      <div className="pointer-events-none fixed inset-safe z-20">
        <div
          className="control pointer-events-auto absolute bottom-6 left-6 h-32 w-32 touch-none rounded-full border border-paper-100/15 bg-ink-900/40 backdrop-blur-sm"
          onPointerDown={onStickDown}
          onPointerMove={onStickMove}
          onPointerUp={onStickUp}
          onPointerCancel={onStickUp}
        >
          <div
            className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border border-brass-400/50 bg-brass-400/25"
            style={{
              transform: `translate(-50%, -50%) translate(${knob?.x ?? 0}px, ${knob?.y ?? 0}px)`,
            }}
          />
        </div>

        {focusId && (
          <button
            type="button"
            onClick={interact}
            className="animate-fade control pointer-events-auto absolute bottom-8 right-6 h-24 w-24 rounded-full border border-brass-400/60 bg-brass-400/20 px-2 text-[0.62rem] uppercase leading-tight tracking-[0.12em] text-brass-300 backdrop-blur-sm active:scale-95"
          >
            {byId(focusId)?.verb ?? "Examine"}
          </button>
        )}
      </div>
    </>
  );
}
