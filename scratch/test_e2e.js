import PocketBase, { LocalAuthStore } from 'pocketbase';

async function testE2E() {
  console.log("=== Testing End-to-End API Flow ===");
  const authStore = new LocalAuthStore('family_library_auth');
  const pb = new PocketBase('http://127.0.0.1:8090', authStore);

  console.log("1. Authenticating as owner@library.local...");
  const authData = await pb.collection('users').authWithPassword('owner@library.local', 'Password123456!');
  const user = authData.record;
  console.log(`✓ Authenticated as ${user.name} (${user.email}), ID: ${user.id}`);

  console.log("2. Fetching shelves...");
  const shelves = await pb.collection('shelves').getFullList({
    filter: `owner = "${user.id}"`,
    sort: 'sort_order,created'
  });
  console.log(`✓ Shelves returned: ${shelves.length}`);
  shelves.forEach(s => console.log(`   - [${s.category}] ${s.name} (order: ${s.sort_order})`));

  console.log("3. Fetching books...");
  const books = await pb.collection('books').getFullList({
    filter: `owner = "${user.id}"`,
    expand: 'shelf',
    sort: '-created'
  });
  console.log(`✓ Books returned: ${books.length}`);
  books.slice(0, 3).forEach(b => console.log(`   - "${b.title}" by ${b.author} [Shelf: ${b.expand?.shelf?.name}]`));

  console.log("4. Testing create and delete book...");
  const newBook = await pb.collection('books').create({
    owner: user.id,
    shelf: shelves[0].id,
    title: 'E2E Test Book',
    author: 'Test Author',
    status: 'available',
    lendable: true
  });
  console.log(`✓ Created test book ID: ${newBook.id}`);

  await pb.collection('books').delete(newBook.id);
  console.log(`✓ Deleted test book ID: ${newBook.id}`);

  console.log("\nALL TESTS PASSED SUCCESSFULLY! The backend and schema are 100% operational.");
}

testE2E().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
