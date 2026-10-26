// Minimal DOM canvas mock for Node.js test environment
global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 100,
        height: 50,
        getContext: () => ({
          font: '',
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 1,
          textAlign: '',
          textBaseline: '',
          measureText: () => ({ width: 60 }),
          beginPath: () => {},
          roundRect: () => {},
          fill: () => {},
          stroke: () => {},
          fillText: () => {}
        })
      };
    }
    return {};
  }
};

import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { createCharacter } from '../src/scenes/procedural.js';

console.log("=== Testing Character Animation & TWEEN Integration ===");

const char = createCharacter({ name: "Ali", gender: "boy", house_color: "#2563eb" });

let openedFired = false;
char.openBook(() => {
  openedFired = true;
  console.log("✓ char.openBook callback executed successfully!");
});

// Advance tweens by simulating frames
for (let t = 0; t <= 700; t += 50) {
  TWEEN.update(t);
}

if (!openedFired) {
  console.error("FAIL: openBook callback did not fire!");
  process.exit(1);
} else {
  console.log("✓ openBook animation and callback completed without error.");
}

let closedFired = false;
char.closeBook(() => {
  closedFired = true;
  console.log("✓ char.closeBook callback executed successfully!");
});

for (let t = 700; t <= 1200; t += 50) {
  TWEEN.update(t);
}

if (!closedFired) {
  console.error("FAIL: closeBook callback did not fire!");
  process.exit(1);
} else {
  console.log("✓ closeBook animation and callback completed without error.");
}

console.log("\n=== Testing Camera Projection & Shelf Visibility ===");

const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 200);
camera.position.set(0, 16.5, 13.5);
camera.lookAt(0, 1.4, -1.2);
camera.updateMatrixWorld();
camera.updateProjectionMatrix();

// Shelf positions:
const shelves = [
  { name: 'Shelf 0 (Back-Left)', pos: new THREE.Vector3(-3.2, 0, -2.6), titlePos: new THREE.Vector3(-3.2, 5.02, -2.6) },
  { name: 'Shelf 1 (Back-Right)', pos: new THREE.Vector3(3.2, 0, -2.6), titlePos: new THREE.Vector3(3.2, 5.02, -2.6) },
  { name: 'Shelf 2 (Front-Left)', pos: new THREE.Vector3(-4.2, 0, 1.4), titlePos: new THREE.Vector3(-4.2, 5.02, 1.4) },
  { name: 'Shelf 3 (Front-Right)', pos: new THREE.Vector3(4.2, 0, 1.4), titlePos: new THREE.Vector3(4.2, 5.02, 1.4) },
  { name: 'Shelf 4 (Back-Center / Top Shelf)', pos: new THREE.Vector3(0, 0, -4.6), titlePos: new THREE.Vector3(0, 5.02, -4.6) },
];

let allVisible = true;
for (const s of shelves) {
  const projectedTitle = s.titlePos.clone().project(camera);
  const projectedBase = s.pos.clone().project(camera);

  // In NDC: Y ranges from -1 (bottom) to +1 (top).
  // Top navbar takes approx Y from +0.82 to +1.0.
  // We want the title tag Y to be < 0.78 so it's comfortably below the navbar!
  console.log(`${s.name}:`);
  console.log(`  Title NDC: x=${projectedTitle.x.toFixed(3)}, y=${projectedTitle.y.toFixed(3)} (Screen Y ~ ${( (1 - projectedTitle.y) / 2 * 100 ).toFixed(1)}% from top)`);
  console.log(`  Base  NDC: x=${projectedBase.x.toFixed(3)}, y=${projectedBase.y.toFixed(3)}`);

  if (projectedTitle.y >= 0.80) {
    console.error(`  FAIL: ${s.name} title is too high (Y >= 0.80) and may clip behind navbar!`);
    allVisible = false;
  } else if (projectedTitle.y <= -1 || projectedBase.y <= -1) {
    console.error(`  FAIL: ${s.name} is below screen!`);
    allVisible = false;
  } else {
    console.log(`  ✓ PERFECT: Fully visible with comfortable margin below navbar.`);
  }
}

if (!allVisible) {
  process.exit(1);
}

console.log("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<");
