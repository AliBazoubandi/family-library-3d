import PocketBase from 'pocketbase';

async function run() {
  const superPb = new PocketBase('http://127.0.0.1:8090');
  await superPb.collection('_superusers').authWithPassword('admin@library.local', 'Password123456!');

  try {
    const user = superPb.authStore.record;
    console.log("Superuser ID:", user.id);
    const shelves = await superPb.collection('shelves').getFullList({
      filter: `owner = "${user.id}"`,
      sort: 'sort_order,created',
    });
    console.log("Shelves OK:", shelves.length);

    const books = await superPb.collection('books').getFullList({
      filter: `owner = "${user.id}"`,
      expand: 'shelf',
      sort: '-created',
    });
    console.log("Books OK:", books.length);
  } catch (err) {
    console.error("FAIL:", err);
  }
}

run();
