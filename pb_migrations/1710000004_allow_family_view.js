/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.listRule = "@request.auth.id != ''";
  users.viewRule = "@request.auth.id != ''";
  app.save(users);

  const shelves = app.findCollectionByNameOrId("shelves");
  shelves.listRule = "@request.auth.id != ''";
  shelves.viewRule = "@request.auth.id != ''";
  app.save(shelves);

  const books = app.findCollectionByNameOrId("books");
  books.listRule = "@request.auth.id != ''";
  books.viewRule = "@request.auth.id != ''";
  app.save(books);
});
