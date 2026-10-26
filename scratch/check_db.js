import PocketBase from 'pocketbase';

async function check() {
  const pb = new PocketBase('http://127.0.0.1:8090');
  await pb.collection('_superusers').authWithPassword('admin@library.local', 'Password123456!');

  console.log("=== Inspecting Collections ===");
  const collections = await pb.collections.getFullList();
  for (const c of collections) {
    if (c.name === 'shelves' || c.name === 'books' || c.name === 'users') {
      console.log(`\nCollection: ${c.name} (id=${c.id})`);
      console.log(`- listRule: ${c.listRule}`);
      console.log(`- viewRule: ${c.viewRule}`);
      console.log(`- createRule: ${c.createRule}`);
      console.log(`- updateRule: ${c.updateRule}`);
      console.log(`- deleteRule: ${c.deleteRule}`);
      console.log(`- fields:`, c.fields.map(f => `${f.name} (${f.type}, colId=${f.collectionId || ''})`));
    }
  }

  console.log("\n=== Direct Records Fetch as Superuser ===");
  const allShelves = await pb.collection('shelves').getFullList();
  console.log("Total shelves in DB:", allShelves.length);
  for (const s of allShelves) {
    console.log(" - Shelf:", s.id, s.name, "owner:", s.owner);
  }

  const allBooks = await pb.collection('books').getFullList();
  console.log("Total books in DB:", allBooks.length);
  for (const b of allBooks.slice(0, 3)) {
    console.log(" - Book:", b.id, b.title, "owner:", b.owner, "shelf:", b.shelf);
  }

  const allUsers = await pb.collection('users').getFullList();
  console.log("Total users in DB:", allUsers.length);
  for (const u of allUsers) {
    console.log(" - User:", u.id, u.email, u.name);
  }
}

check();
