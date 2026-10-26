import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dir = path.join(__dirname, '..', 'public', 'assets', 'models');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.glb'));

for (const file of files) {
  const buf = fs.readFileSync(path.join(dir, file));
  // GLB header: magic (4), version (4), length (4), chunk0 length (4), chunk0 type (4)
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) { // 'glTF'
    console.log(file, 'Not valid GLB');
    continue;
  }
  const chunkLength = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonStr);
  console.log(`\n=== ${file} ===`);
  console.log('Meshes:', gltf.meshes?.map(m => m.name));
  console.log('Nodes count:', gltf.nodes?.length);
  console.log('Nodes sample:', gltf.nodes?.slice(0, 8).map(n => n.name));
  console.log('Animations:', gltf.animations?.map(a => a.name));
  console.log('Materials:', gltf.materials?.map(m => m.name));
}
