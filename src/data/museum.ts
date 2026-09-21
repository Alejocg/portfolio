/**
 * Floor plan for the museum.
 *
 * A single hall. Everything the visitor can bump into is declared here once, as
 * axis-aligned boxes, and both the renderer and the collision solver read from
 * this list -- which is what stops the classic bug where a wall gets moved on
 * screen but the invisible one stays behind.
 *
 * Axes: +x is east, +z is south, +y is up. All units are metres.
 */

export type Box = {
  /** Centre of the box. */
  position: [number, number, number];
  /** Full extents, not half-extents. */
  size: [number, number, number];
};

const T = 0.6; // wall thickness

/** Interior bounds of the hall, used for floor, ceiling and light placement. */
export const HALL = {
  minX: -13,
  maxX: 13,
  minZ: -9,
  maxZ: 9,
  height: 8.5,
} as const;

/**
 * The skylight opening, and the beams that cross it.
 *
 * A single bright rectangle gives one soft wash. Splitting it with beams gives
 * a row of separate shafts and a ladder of light on the floor, which is what
 * makes the room feel like a building rather than a box.
 */
export const SKYLIGHT = {
  minX: -8,
  maxX: 8,
  minZ: -2.6,
  maxZ: 2.6,
  /** Beam centres along x. */
  beams: [-6, -3, 0, 3, 6],
  beamWidth: 0.42,
} as const;

/** Helper: build a wall box from a centreline run along one axis. */
function wall(axis: "x" | "z", fixed: number, from: number, to: number, height: number): Box {
  const mid = (from + to) / 2;
  const span = Math.abs(to - from);
  return axis === "x"
    ? { position: [fixed, height / 2, mid], size: [T, height, span] }
    : { position: [mid, height / 2, fixed], size: [span, height, T] };
}

const H = HALL;

export const WALLS: Box[] = [
  wall("z", H.minZ - T / 2, H.minX - T, H.maxX + T, H.height), // north
  wall("z", H.maxZ + T / 2, H.minX - T, H.maxX + T, H.height), // south
  wall("x", H.minX - T / 2, H.minZ - T, H.maxZ + T, H.height), // west
  wall("x", H.maxX + T / 2, H.minZ - T, H.maxZ + T, H.height), // east
];

/**
 * Furniture the visitor should not walk through. Heights are irrelevant to the
 * solver -- it works in 2D -- but are kept accurate so this list can double as
 * a debug view.
 */
export const PROP_COLLIDERS: Box[] = [
  { position: [0, 0.4, 6.2], size: [2.9, 0.8, 1.2] }, // bench, facing the north wall
  { position: [8.5, 0.6, 4], size: [1.4, 1.2, 1.4] }, // toolkit plinth
  { position: [0, 1, 0], size: [1.7, 2, 1.7] }, // the attendant, hovering mid-hall

  // Planters, one to each corner.
  { position: [-11.4, 0.5, -7.4], size: [1.3, 1, 1.3] },
  { position: [11.4, 0.5, -7.4], size: [1.3, 1, 1.3] },
  { position: [-11.4, 0.5, 7.4], size: [1.3, 1, 1.3] },
  { position: [11.4, 0.5, 7.4], size: [1.3, 1, 1.3] },
];

export const COLLIDERS: Box[] = [...WALLS, ...PROP_COLLIDERS];

/** Where the visitor starts, and which way they are looking. */
export const SPAWN = {
  position: [0, 1.7, 7.4] as [number, number, number],
  /**
   * Facing north, towards the engraved wall.
   *
   * A camera looks down its own -z, so a yaw of 0 already points north; PI
   * would spin the visitor around to stare at the wall behind them.
   */
  yaw: 0,
};

export const PLAYER = {
  radius: 0.42,
  eyeHeight: 1.7,
  speed: 4.2,
  sprint: 7.4,
  /** How close you must be for a piece to become interactive. */
  reach: 5,
};
