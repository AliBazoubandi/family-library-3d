/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const shelves = app.findCollectionByNameOrId("shelves");
  const books = app.findCollectionByNameOrId("books");

  // 1. Create or retrieve seed user
  let user;
  try {
    user = app.findAuthRecordByEmail("users", "owner@library.local");
  } catch (_) {
    user = new Record(users);
    user.setEmail("owner@library.local");
    user.setPassword("Password123456!");
    user.set("name", "Ali");
    user.set("gender", "m");
    user.set("house_color", "#4f46e5");
    app.save(user);
  }

  // 2. Create 4 shelves
  const shelfDefinitions = [
    { name: "Fiction & Stories", category: "fiction", sort_order: 1 },
    { name: "Non-Fiction & Science", category: "non-fiction", sort_order: 2 },
    { name: "Sci-Fi & Fantasy", category: "scifi-fantasy", sort_order: 3 },
    { name: "Philosophy & Arts", category: "philosophy", sort_order: 4 },
  ];

  const createdShelves = {};
  for (const sDef of shelfDefinitions) {
    const shelf = new Record(shelves, {
      owner: user.id,
      name: sDef.name,
      category: sDef.category,
      sort_order: sDef.sort_order,
    });
    app.save(shelf);
    createdShelves[sDef.category] = shelf.id;
  }

  // 3. Create 12 sample books
  const sampleBooks = [
    // Shelf: Fiction
    {
      category: "fiction",
      title: "The Little Prince",
      author: "Antoine de Saint-Exupéry",
      isbn: "9780156012195",
      cover_url: "https://covers.openlibrary.org/b/isbn/9780156012195-M.jpg",
      notes: "A timeless tale about love, friendship, and seeing with the heart.",
      lendable: true,
      status: "available",
      lent_to: "",
      lent_at: ""
    },
    {
      category: "fiction",
      title: "One Hundred Years of Solitude",
      author: "Gabriel García Márquez",
      isbn: "9780060883287",
      cover_url: "https://covers.openlibrary.org/b/isbn/9780060883287-M.jpg",
      notes: "Masterpiece of magical realism and the multi-generational Buendía family.",
      lendable: true,
      status: "available",
      lent_to: "",
      lent_at: ""
    },
    {
      category: "fiction",
      title: "1984",
      author: "George Orwell",
      isbn: "9780451524935",
      cover_url: "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg",
      notes: "Classic dystopian social science fiction exploring surveillance and truth.",
      lendable: true,
      status: "lent",
      lent_to: "Sarah",
      lent_at: "2026-03-01 10:00:00.000Z"
    },

    // Shelf: Non-Fiction
    {
      category: "non-fiction",
      title: "Sapiens: A Brief History of Humankind",
      author: "Yuval Noah Harari",
      isbn: "9780062316097",
      cover_url: "https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg",
      notes: "Fascinating overview from the Stone Age to the modern Silicon Age.",
      lendable: true,
      status: "available",
      lent_to: "",
      lent_at: ""
    },
    {
      category: "non-fiction",
      title: "Thinking, Fast and Slow",
      author: "Daniel Kahneman",
      isbn: "9780374533557",
      cover_url: "https://covers.openlibrary.org/b/isbn/9780374533557-M.jpg",
      notes: "System 1 vs System 2 thinking, cognitive biases, and behavioral economics.",
      lendable: true,
      status: "available",
      lent_to: "",
      lent_at: ""
    },
    {
      category: "non-fiction",
      title: "Cosmos",
      author: "Carl Sagan",
      isbn: "9780345331359",
      cover_url: "https://covers.openlibrary.org/b/isbn/9780345331359-M.jpg",
      notes: "An awe-inspiring journey through the universe and scientific discovery.",
      lendable: true,
      status: "available",
      lent_to: "",
      lent_at: ""
    },

    // Shelf: Sci-Fi & Fantasy
    {
      category: "scifi-fantasy",
      title: "Dune",
      author: "Frank Herbert",
      isbn: "9780441172719",
      cover_url: "https://covers.openlibrary.org/b/isbn/9780441172719-M.jpg",
      notes: "Epic sci-fi saga on Arrakis revolving around politics, ecology, and spice.",
      lendable: true,
      status: "available",
      lent_to: "",
      lent_at: ""
    },
    {
      category: "scifi-fantasy",
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      isbn: "9780547928227",
      cover_url: "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg",
      notes: "Bilbo Baggins' wonderful adventure to the Lonely Mountain.",
      lendable: true,
      status: "available",
      lent_to: "",
      lent_at: ""
    },
    {
      category: "scifi-fantasy",
      title: "Neuromancer",
      author: "William Gibson",
      isbn: "9780441569595",
      cover_url: "https://covers.openlibrary.org/b/isbn/9780441569595-M.jpg",
      notes: "The foundational cyberpunk novel coining the matrix and cyberspace.",
      lendable: true,
      status: "lent",
      lent_to: "David",
      lent_at: "2026-03-15 14:30:00.000Z"
    },

    // Shelf: Philosophy & Arts
    {
      category: "philosophy",
      title: "Meditations",
      author: "Marcus Aurelius",
      isbn: "9780812968255",
      cover_url: "https://covers.openlibrary.org/b/isbn/9780812968255-M.jpg",
      notes: "Personal stoic philosophical writings of the Roman Emperor.",
      lendable: true,
      status: "available",
      lent_to: "",
      lent_at: ""
    },
    {
      category: "philosophy",
      title: "The Story of Art",
      author: "E.H. Gombrich",
      isbn: "9780714832470",
      cover_url: "https://covers.openlibrary.org/b/isbn/9780714832470-M.jpg",
      notes: "One of the most accessible and celebrated introductions to art history.",
      lendable: true,
      status: "available",
      lent_to: "",
      lent_at: ""
    },
    {
      category: "philosophy",
      title: "Man's Search for Meaning",
      author: "Viktor E. Frankl",
      isbn: "9780807014295",
      cover_url: "https://covers.openlibrary.org/b/isbn/9780807014295-M.jpg",
      notes: "Psychiatrist's memoir and introduction to logotherapy through adversity.",
      lendable: true,
      status: "available",
      lent_to: "",
      lent_at: ""
    }
  ];

  for (const b of sampleBooks) {
    const bookRecord = new Record(books, {
      owner: user.id,
      shelf: createdShelves[b.category],
      title: b.title,
      author: b.author,
      isbn: b.isbn,
      cover_url: b.cover_url,
      notes: b.notes,
      lendable: b.lendable,
      status: b.status,
      lent_to: b.lent_to,
      lent_at: b.lent_at ? b.lent_at : null
    });
    app.save(bookRecord);
  }
}, (app) => {
  // Down migration
  try {
    const books = app.findCollectionByNameOrId("books");
    const shelves = app.findCollectionByNameOrId("shelves");
    const allBooks = app.findRecordsByFilter("books", "id != ''", "", 500, 0);
    for (const b of allBooks) {
      app.delete(b);
    }
    const allShelves = app.findRecordsByFilter("shelves", "id != ''", "", 100, 0);
    for (const s of allShelves) {
      app.delete(s);
    }
  } catch (_) {}
});
