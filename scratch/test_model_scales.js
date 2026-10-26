import * as THREE from 'three';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'public', 'assets', 'models');

// Parse GLB JSON chunk and calculate mesh bounding boxes
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.glb'))) {
  const buf = fs.readFileSync(path.join(dir, file));
  const chunkLength = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonStr);

  console.log(`\nModel: ${file}`);
  if (gltf.nodes) {
    gltf.nodes.forEach((n, i) => {
      if (n.mesh !== undefined || n.children) {
        console.log(`  Node ${i} (${n.name || 'unnamed'}): mesh=${n.mesh}, scale=${JSON.stringify(n.scale)}, trans=${JSON.stringify(n.translation)}`);
      }
    });
  }
}
