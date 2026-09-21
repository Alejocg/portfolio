import type { Box } from "../../data/museum";

/**
 * Push a circle out of a set of axis-aligned boxes, in 2D.
 *
 * The visitor is a circle of `radius` on the XZ plane. Rather than test the
 * circle against each box, every box is inflated by the radius and the visitor
 * is treated as a point -- the standard Minkowski trick. When the point lands
 * inside an inflated box we shove it out along whichever of the four sides is
 * nearest, which is what produces the familiar "slide along the wall" feel
 * instead of sticking.
 *
 * Two passes, because escaping one box can push you into its neighbour at an
 * inside corner.
 */
export function resolveCollisions(
  x: number,
  z: number,
  radius: number,
  boxes: Box[],
  passes = 2,
): [number, number] {
  let px = x;
  let pz = z;

  for (let pass = 0; pass < passes; pass++) {
    let moved = false;

    for (const box of boxes) {
      const minX = box.position[0] - box.size[0] / 2 - radius;
      const maxX = box.position[0] + box.size[0] / 2 + radius;
      const minZ = box.position[2] - box.size[2] / 2 - radius;
      const maxZ = box.position[2] + box.size[2] / 2 + radius;

      if (px <= minX || px >= maxX || pz <= minZ || pz >= maxZ) continue;

      const toLeft = px - minX;
      const toRight = maxX - px;
      const toNear = pz - minZ;
      const toFar = maxZ - pz;
      const shortest = Math.min(toLeft, toRight, toNear, toFar);

      if (shortest === toLeft) px = minX;
      else if (shortest === toRight) px = maxX;
      else if (shortest === toNear) pz = minZ;
      else pz = maxZ;

      moved = true;
    }

    if (!moved) break;
  }

  return [px, pz];
}
