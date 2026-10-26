import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'public', 'assets', 'models');

// Let's inspect the bounding boxes from glTF accessor min/max
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.glb'))) {
  const buf = fs.readFileSync(path.join(dir, file));
  const chunkLength = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonStr);

  // find position accessor min/max to see real world scale
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];

  for (const acc of gltf.accessors || []) {
    if (acc.min && acc.max && acc.type === 'VEC3') {
      for (let i = 0; i < 3; i++) {
        if (acc.min[i] < min[i]) min[i] = acc.min[i];
        if (acc.max[i] > max[i]) max[i] = acc.max[i];
      }
    }
  }

  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  console.log(`${file}:`);
  console.log(`  Min: [${min.map(n => n.toFixed(2)).join(', ')}]`);
  console.log(`  Max: [${max.map(n => n.toFixed(2)).join(', ')}]`);
  console.log(`  Size: [${size.map(n => n.toFixed(2)).join(', ')}]`);
}
