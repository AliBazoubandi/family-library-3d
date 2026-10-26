import PocketBase from 'pocketbase';

async function testBooksWorking() {
  const pb = new PocketBase('http://127.0.0.1:8090');
  await pb.collection('users').authWithPassword('owner@library.local', 'Password123456!');
  const userId = pb.authStore.record.id;

  try {
    const books = await pb.collection('books').getFullList({
      filter: `owner = "${userId}"`,
      expand: 'shelf',
      sort: '-id'
    });
    console.log("SUCCESS! Books fetched:", books.length);
    for (const b of books.slice(0, 3)) {
      console.log(` - ${b.title} by ${b.author} (Shelf: ${b.expand?.shelf?.name})`);
    }
  } catch (err) {
    console.error("FAILED:", err);
  }
}

testBooksWorking();
