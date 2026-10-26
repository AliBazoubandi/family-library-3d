/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const shelves = app.findCollectionByNameOrId("shelves");
  if (!shelves.fields.getByName("created")) {
    shelves.fields.add(new AutodateField({ name: "created", onCreate: true }));
  }
  if (!shelves.fields.getByName("updated")) {
    shelves.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  }
  app.save(shelves);

  const books = app.findCollectionByNameOrId("books");
  if (!books.fields.getByName("created")) {
    books.fields.add(new AutodateField({ name: "created", onCreate: true }));
  }
  if (!books.fields.getByName("updated")) {
    books.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  }
  app.save(books);
});
