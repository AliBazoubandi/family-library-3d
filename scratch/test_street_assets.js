import { scanBundle } from './test_poly.js';

async function main() {
  const bundles = [
    'https://poly.pizza/bundle/City-Kit-0CkvGrBJ0u',
    'https://poly.pizza/bundle/Suburban-Houses-Pack-dZQwy8vcDv',
    'https://poly.pizza/bundle/Cars-Bundle-FE5IWe6OMk',
    'https://poly.pizza/bundle/City-Builder-Bits-1wLdnIddSx'
  ];

  for (const b of bundles) {
    console.log('\n--- Scanning', b, '---');
    const models = await scanBundle(b);
    console.log(`Bundle: ${models[0]?.bundle || 'unknown'} (${models.length} models)`);
    models.forEach(m => {
      if (/house|car|tree|lamp|bench|fence|mail|road|path|hydrant|bush/i.test(m.title)) {
        console.log(`  - ${m.title}: ${m.glbUrl}`);
      }
    });
  }
}

main();
