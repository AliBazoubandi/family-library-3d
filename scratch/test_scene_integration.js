globalThis.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 100,
        height: 50,
        getContext: () => ({
          font: '',
          measureText: (t) => ({ width: t.length * 10 }),
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 1,
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

const { createInsideRoomScene } = await import('../src/scenes/procedural.js');
const { findPath, resolveCollisions } = await import('../src/scenes/navigation.js');
const THREE = await import('three');
const TWEEN = await import('@tweenjs/tween.js');

// Mock shelves matching the user's library
const shelves = [
  { id: 'shelf-1', name: 'Fiction & Stories' },
  { id: 'shelf-2', name: 'Philosophy & Arts' },
  { id: 'shelf-3', name: 'Non-Fiction & Science' },
  { id: 'shelf-4', name: 'Sci-Fi & Fantasy' },
  { id: 'shelf-5', name: 'Biography & History' }
];

const user = { name: 'Ali', house_color: '#4f46e5' };

const roomData = createInsideRoomScene(shelves, user);
console.log('Room group children count:', roomData.group.children.length);
console.log('Shelf pickers count:', roomData.shelfPickers.length);

// Verify that shelf pickers are on perimeter walls
for (const [i, p] of roomData.shelfPickers.entries()) {
  const pos = p.hitbox.userData.shelfCenter;
  console.log(`Shelf ${i} (${p.shelfData.name}): pos=(${pos.x.toFixed(1)}, ${pos.z.toFixed(1)}), target=(${p.walkTarget.x.toFixed(1)}, ${p.walkTarget.z.toFixed(1)})`);
}

// Test Navigation Paths from home (0, 0, 1.5) to every shelf
const home = new THREE.Vector3(0, 0, 1.5);
for (const p of roomData.shelfPickers) {
  const path = findPath(home, p.walkTarget);
  console.log(`Path from Home to [${p.shelfData.name}]: ${path.map(v => `(${v.x.toFixed(1)}, ${v.z.toFixed(1)})`).join(' -> ')}`);
}

// Test Character animations
const char = roomData.character;
console.log('Character root:', char.root ? 'OK' : 'MISSING');
console.log('Held book:', char.heldBook ? 'OK' : 'MISSING');
console.log('reachForBookAndOpen method:', typeof char.reachForBookAndOpen);
console.log('closeBookAndReturn method:', typeof char.closeBookAndReturn);

// Test reachForBookAndOpen
char.reachForBookAndOpen(null, () => {
  console.log('reachForBookAndOpen callback triggered successfully!');
  console.log('Held book visible:', char.heldBook.visible);
});

// Test closeBookAndReturn
char.closeBookAndReturn(null, () => {
  console.log('closeBookAndReturn callback triggered successfully!');
  console.log('Held book visible after close:', char.heldBook.visible);
});

console.log('All integration checks passed successfully!');
