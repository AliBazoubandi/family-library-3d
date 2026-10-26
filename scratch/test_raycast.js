global.document = {
  createElement: () => ({
    getContext: () => ({
      measureText: () => ({ width: 100 }),
      beginPath: () => {},
      roundRect: () => {},
      fill: () => {},
      stroke: () => {},
      fillText: () => {}
    })
  })
};
import * as THREE from 'three';
import { createStreetScene } from '../src/scenes/procedural.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(0, 10, 24);
camera.lookAt(0, 2, 0);
camera.updateMatrixWorld();

const user = { name: 'Ali', house_color: '#4f46e5' };
const street = createStreetScene(user);
scene.add(street.group);

const raycaster = new THREE.Raycaster();
// Shoot ray right at center of screen (0, 0)
raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

const targets = [street.houseHitBox, street.houseGroup];
const hits = raycaster.intersectObjects(targets, true);
console.log("Hits found:", hits.length);
if (hits.length > 0) {
  console.log("First hit object:", hits[0].object.type, "name/userData:", hits[0].object.userData);
} else {
  console.log("NO HITS! Checking why...");
  console.log("houseHitBox visible:", street.houseHitBox.visible, "mat visible:", street.houseHitBox.material.visible);
}
