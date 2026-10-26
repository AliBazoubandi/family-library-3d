import * as THREE from 'three';

/**
 * 2D Obstacle and Collision System for the Cozy Library Room.
 * Ensures the character never clips or walks through central furniture (table, armchair)
 * or perimeter bookshelves and walls.
 */

export const ROOM_BOUNDS = {
  minX: -6.6,
  maxX: 6.6,
  minZ: -6.6,
  maxZ: 5.5
};

// Bounding box of the central seating island (reading desk + velvet armchair)
export const CENTRAL_OBSTACLE = {
  minX: -1.5,
  maxX: 1.5,
  minZ: -2.5,
  maxZ: 1.15
};

// Individual furniture colliders for precise sliding collision
export const FURNITURE_COLLIDERS = [
  // Central round reading table
  { type: 'circle', x: 0, z: 0, radius: 1.15 },
  // Central reading armchair
  { type: 'box', minX: -0.9, maxX: 0.9, minZ: -2.2, maxZ: -0.7 },
  // Left potted plant
  { type: 'circle', x: -6.6, z: -6.6, radius: 0.9 },
  // Right potted plant
  { type: 'circle', x: 6.6, z: -6.6, radius: 0.9 }
];

/**
 * Checks if line segment (p1 -> p2) intersects the central obstacle AABB.
 */
function lineIntersectsBox(p1, p2, box) {
  let tmin = 0.0;
  let tmax = 1.0;
  const dx = p2.x - p1.x;
  const dz = p2.z - p1.z;

  // X slab
  if (Math.abs(dx) < 1e-6) {
    if (p1.x < box.minX || p1.x > box.maxX) return false;
  } else {
    const ood = 1.0 / dx;
    let t1 = (box.minX - p1.x) * ood;
    let t2 = (box.maxX - p1.x) * ood;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }

  // Z slab
  if (Math.abs(dz) < 1e-6) {
    if (p1.z < box.minZ || p1.z > box.maxZ) return false;
  } else {
    const ood = 1.0 / dz;
    let t1 = (box.minZ - p1.z) * ood;
    let t2 = (box.maxZ - p1.z) * ood;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }

  return true;
}

/**
 * Generates an obstacle-free series of 3D waypoints from start to target.
 */
export function findPath(from, to) {
  if (!lineIntersectsBox(from, to, CENTRAL_OBSTACLE)) {
    return [from.clone(), to.clone()];
  }

  // Calculate waypoints passing through West (-X) or East (+X) clearance corridors
  const westX = -2.6;
  const eastX = 2.6;

  // Midpoint Z coordinates that safely flank the central obstacle
  const midZ1 = Math.max(from.z, CENTRAL_OBSTACLE.maxZ + 0.35);
  const midZ2 = Math.min(to.z, CENTRAL_OBSTACLE.minZ - 0.35);

  const westRoute = [
    from.clone(),
    new THREE.Vector3(westX, 0, midZ1),
    new THREE.Vector3(westX, 0, midZ2),
    to.clone()
  ];

  const eastRoute = [
    from.clone(),
    new THREE.Vector3(eastX, 0, midZ1),
    new THREE.Vector3(eastX, 0, midZ2),
    to.clone()
  ];

  const getDist = (pts) => {
    let d = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      d += pts[i].distanceTo(pts[i + 1]);
    }
    return d;
  };

  // Preference bias depending on whether start and target are on west or east side
  const westDist = getDist(westRoute) + (from.x > 0 ? 0.6 : -0.6) + (to.x > 0 ? 0.6 : -0.6);
  const eastDist = getDist(eastRoute) + (from.x < 0 ? 0.6 : -0.6) + (to.x < 0 ? 0.6 : -0.6);

  const chosen = (westDist <= eastDist) ? westRoute : eastRoute;

  // Prune redundant intermediate points
  const cleaned = [chosen[0]];
  for (let i = 1; i < chosen.length; i++) {
    if (cleaned[cleaned.length - 1].distanceTo(chosen[i]) > 0.35) {
      cleaned.push(chosen[i]);
    }
  }
  return cleaned;
}

/**
 * Continuous collision resolution: Slides pos against furniture obstacles and walls.
 * Modifies pos in place or returns adjusted Vector3.
 */
export function resolveCollisions(pos, charRadius = 0.38) {
  // 1. Clamp to room boundary
  pos.x = Math.max(ROOM_BOUNDS.minX + charRadius, Math.min(ROOM_BOUNDS.maxX - charRadius, pos.x));
  pos.z = Math.max(ROOM_BOUNDS.minZ + charRadius, Math.min(ROOM_BOUNDS.maxZ - charRadius, pos.z));

  // 2. Resolve against circular table
  const table = FURNITURE_COLLIDERS[0];
  const dx = pos.x - table.x;
  const dz = pos.z - table.z;
  const dist = Math.hypot(dx, dz);
  const minDist = table.radius + charRadius;
  if (dist < minDist && dist > 1e-4) {
    const push = (minDist - dist) / dist;
    pos.x += dx * push;
    pos.z += dz * push;
  }

  // 3. Resolve against armchair AABB
  const chair = FURNITURE_COLLIDERS[1];
  const cMinX = chair.minX - charRadius;
  const cMaxX = chair.maxX + charRadius;
  const cMinZ = chair.minZ - charRadius;
  const cMaxZ = chair.maxZ + charRadius;

  if (pos.x > cMinX && pos.x < cMaxX && pos.z > cMinZ && pos.z < cMaxZ) {
    // Find closest edge to push out
    const dLeft = pos.x - cMinX;
    const dRight = cMaxX - pos.x;
    const dBack = pos.z - cMinZ;
    const dFront = cMaxZ - pos.z;

    const minD = Math.min(dLeft, dRight, dBack, dFront);
    if (minD === dLeft) pos.x = cMinX;
    else if (minD === dRight) pos.x = cMaxX;
    else if (minD === dBack) pos.z = cMinZ;
    else pos.z = cMaxZ;
  }

  return pos;
}
