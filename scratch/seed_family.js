global.window = { location: { origin: 'http://127.0.0.1:8090' } };
const { pb } = await import('../src/api/client.js');

await pb.collection('_superusers').authWithPassword('admin@library.local', 'Password123456!');
const users = await pb.collection('users').getFullList();
console.log('Loaded users:', users.map(u => u.name));

const sara = users.find(u => u.name === 'Sara');
const reza = users.find(u => u.name === 'Reza');

if (sara) {
  const existing = await pb.collection('shelves').getFullList({ filter: `owner = "${sara.id}"` });
  if (existing.length === 0) {
    const s1 = await pb.collection('shelves').create({ owner: sara.id, name: 'Graphic Novels & Manga', category: 'manga', sort_order: 1 });
    const s2 = await pb.collection('shelves').create({ owner: sara.id, name: 'Psychology & Growth', category: 'psychology', sort_order: 2 });
    const s3 = await pb.collection('shelves').create({ owner: sara.id, name: 'Poetry & Classical Arts', category: 'poetry', sort_order: 3 });

    await pb.collection('books').create({ owner: sara.id, shelf: s1.id, title: 'Spirited Away: The Artbook', author: 'Hayao Miyazaki', isbn: '9781569317778', lendable: true, status: 'available' });
    await pb.collection('books').create({ owner: sara.id, shelf: s2.id, title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', lendable: true, status: 'available' });
    console.log('Seeded Sara shelves & books');
  } else {
    console.log('Sara already has shelves:', existing.map(s => s.name));
  }
}

if (reza) {
  const existing = await pb.collection('shelves').getFullList({ filter: `owner = "${reza.id}"` });
  if (existing.length === 0) {
    const r1 = await pb.collection('shelves').create({ owner: reza.id, name: 'Computer Architecture', category: 'tech', sort_order: 1 });
    const r2 = await pb.collection('shelves').create({ owner: reza.id, name: 'World History & Empires', category: 'history', sort_order: 2 });

    await pb.collection('books').create({ owner: reza.id, shelf: r1.id, title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', lendable: true, status: 'available' });
    await pb.collection('books').create({ owner: reza.id, shelf: r2.id, title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', isbn: '9780062316097', lendable: true, status: 'available' });
    console.log('Seeded Reza shelves & books');
  } else {
    console.log('Reza already has shelves:', existing.map(s => s.name));
  }
}
