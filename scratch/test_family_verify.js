import PocketBase from 'pocketbase';

async function verifyFamily() {
  const pb = new PocketBase('http://127.0.0.1:8090');
  await pb.collection('users').authWithPassword('owner@library.local', 'Password123456!');
  console.log('✓ Successfully authenticated as:', pb.authStore.record.name, `(${pb.authStore.record.email})`);

  const users = await pb.collection('users').getFullList({ sort: 'created' });
  console.log(`✓ Fetched ${users.length} family members in neighborhood:`);

  for (const u of users) {
    const shelves = await pb.collection('shelves').getFullList({ filter: `owner = "${u.id}"` });
    const books = await pb.collection('books').getFullList({ filter: `owner = "${u.id}"` });
    console.log(`  - ${u.name} (ID: ${u.id}) | Gender: ${u.gender} | Theme: ${u.house_color} | Shelves: ${shelves.length} | Books: ${books.length}`);
  }
}

verifyFamily().catch(console.error);
