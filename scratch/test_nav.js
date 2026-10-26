import * as THREE from 'three';

// Forbidden zone around central table & chair
const OBSTACLE = {
  minX: -1.6,
  maxX: 1.6,
  minZ: -2.6,
  maxZ: 1.2
};

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

export function findPath(from, to) {
  if (!lineIntersectsBox(from, to, OBSTACLE)) {
    return [from.clone(), to.clone()];
  }

  // Needs obstacle routing
  // Waypoints around West (-X) or East (+X)
  const westRoute = [
    from.clone(),
    new THREE.Vector3(-2.4, 0, Math.max(from.z, OBSTACLE.maxZ + 0.2)),
    new THREE.Vector3(-2.4, 0, Math.min(to.z, OBSTACLE.minZ - 0.2)),
    to.clone()
  ];

  const eastRoute = [
    from.clone(),
    new THREE.Vector3(2.4, 0, Math.max(from.z, OBSTACLE.maxZ + 0.2)),
    new THREE.Vector3(2.4, 0, Math.min(to.z, OBSTACLE.minZ - 0.2)),
    to.clone()
  ];

  // Calculate distance of route
  const getDist = (pts) => {
    let d = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      d += pts[i].distanceTo(pts[i + 1]);
    }
    return d;
  };

  // Bias towards whichever side start/end is already on
  const westDist = getDist(westRoute) + (from.x > 0 ? 0.5 : -0.5);
  const eastDist = getDist(eastRoute) + (from.x < 0 ? 0.5 : -0.5);

  const chosen = (westDist < eastDist) ? westRoute : eastRoute;

  // Clean redundant points (if two points are identical or very close)
  const cleaned = [chosen[0]];
  for (let i = 1; i < chosen.length; i++) {
    if (cleaned[cleaned.length - 1].distanceTo(chosen[i]) > 0.3) {
      cleaned.push(chosen[i]);
    }
  }
  return cleaned;
}

// Test paths
const start = new THREE.Vector3(0, 0, 1.8);
const targets = [
  new THREE.Vector3(0, 0, -5.7),    // Back center shelf
  new THREE.Vector3(-4.6, 0, -5.7), // Back left shelf
  new THREE.Vector3(4.6, 0, -5.7),  // Back right shelf
  new THREE.Vector3(-5.7, 0, -3.2), // Left wall shelf
  new THREE.Vector3(5.7, 0, 1.8),   // Right wall front shelf
];

for (const t of targets) {
  const p = findPath(start, t);
  console.log(`Path to (${t.x}, ${t.z}): ${p.map(v => `(${v.x.toFixed(1)}, ${v.z.toFixed(1)})`).join(' -> ')}`);
}
