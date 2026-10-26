import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'public', 'assets', 'models');

const loader = new GLTFLoader();

for (const name of ['character_m.glb', 'shelf.glb', 'chair.glb', 'table.glb']) {
  const buf = fs.readFileSync(path.join(dir, name));
  const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  loader.parse(arrayBuf, '', (gltf) => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    console.log(`\n=== Parsed ${name} ===`);
    console.log('Size:', size);
    console.log('Min:', box.min);
    console.log('Max:', box.max);
    console.log('Center:', center);
    console.log('Animations:', gltf.animations.map(a => a.name));
  }, (err) => {
    console.error('Parse error for', name, err);
  });
}
