import * as THREE from 'three';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'public', 'assets', 'models');

// Parse GLTF JSON chunk and extract position buffer data to compute true Box3
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.glb'))) {
  const buf = fs.readFileSync(path.join(dir, file));
  const chunkLength = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonStr);

  const binOffset = 20 + chunkLength;
  const binLength = buf.readUInt32LE(binOffset);
  const binData = buf.subarray(binOffset + 8, binOffset + 8 + binLength);

  let min = new THREE.Vector3(Infinity, Infinity, Infinity);
  let max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

  // Look through nodes
  for (const node of gltf.nodes || []) {
    if (node.mesh !== undefined) {
      const mesh = gltf.meshes[node.mesh];
      for (const prim of mesh.primitives || []) {
        const posAccIdx = prim.attributes.POSITION;
        if (posAccIdx !== undefined) {
          const acc = gltf.accessors[posAccIdx];
          const accMin = new THREE.Vector3(...acc.min);
          const accMax = new THREE.Vector3(...acc.max);
          if (node.scale) {
            accMin.multiply(new THREE.Vector3(...node.scale));
            accMax.multiply(new THREE.Vector3(...node.scale));
          }
          if (node.translation) {
            accMin.add(new THREE.Vector3(...node.translation));
            accMax.add(new THREE.Vector3(...node.translation));
          }
          min.min(accMin);
          max.max(accMax);
        }
      }
    }
  }

  const size = new THREE.Vector3().subVectors(max, min);
  console.log(`${file}:`);
  console.log(`  Size: [${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)}]`);
  console.log(`  Min:  [${min.x.toFixed(2)}, ${min.y.toFixed(2)}, ${min.z.toFixed(2)}]`);
  console.log(`  Max:  [${max.x.toFixed(2)}, ${max.y.toFixed(2)}, ${max.z.toFixed(2)}]`);
}
