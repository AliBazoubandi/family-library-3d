/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // 1. Extend built-in users collection with name, gender, and house_color
  const users = app.findCollectionByNameOrId("users");

  if (!users.fields.getByName("gender")) {
    users.fields.add(new SelectField({
      name: "gender",
      values: ["m", "f"],
      maxSelect: 1,
      required: false
    }));
  }

  if (!users.fields.getByName("house_color")) {
    users.fields.add(new TextField({
      name: "house_color",
      required: false
    }));
  }

  app.save(users);

  // 2. Shelves collection
  // Phase 1 API Rules: Only the authenticated owner can view, create, edit, or delete their shelves.
  // Phase 2 Extension: In Phase 2, viewRule and listRule can be changed to '@request.auth.id != ""'
  // or a family membership rule so other family members can see the shelves in the street.
  const shelves = new Collection({
    type: "base",
    name: "shelves",
    listRule: "@request.auth.id != '' && owner = @request.auth.id",
    viewRule: "@request.auth.id != '' && owner = @request.auth.id",
    createRule: "@request.auth.id != '' && owner = @request.auth.id",
    updateRule: "@request.auth.id != '' && owner = @request.auth.id",
    deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
  });

  shelves.fields.add(new RelationField({
    name: "owner",
    collectionId: users.id,
    cascadeDelete: true,
    maxSelect: 1,
    required: true
  }));

  shelves.fields.add(new TextField({
    name: "name",
    required: true
  }));

  shelves.fields.add(new TextField({
    name: "category",
    required: true
  }));

  shelves.fields.add(new NumberField({
    name: "sort_order",
    required: false
  }));

  app.save(shelves);

  // 3. Books collection
  // Phase 1 API Rules: Only the authenticated owner can access and manage their books.
  // Phase 2 Extension: In Phase 2, viewRule and listRule can be broadened to all family members
  // (e.g. '@request.auth.id != ""' or '@request.auth.family_id = owner.family_id') so family
  // members can browse each other's libraries and request to borrow books.
  const books = new Collection({
    type: "base",
    name: "books",
    listRule: "@request.auth.id != '' && owner = @request.auth.id",
    viewRule: "@request.auth.id != '' && owner = @request.auth.id",
    createRule: "@request.auth.id != '' && owner = @request.auth.id",
    updateRule: "@request.auth.id != '' && owner = @request.auth.id",
    deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
  });

  books.fields.add(new RelationField({
    name: "owner",
    collectionId: users.id,
    cascadeDelete: true,
    maxSelect: 1,
    required: true
  }));

  books.fields.add(new RelationField({
    name: "shelf",
    collectionId: shelves.id,
    cascadeDelete: false,
    maxSelect: 1,
    required: true
  }));

  books.fields.add(new TextField({
    name: "title",
    required: true
  }));

  books.fields.add(new TextField({
    name: "author",
    required: true
  }));

  books.fields.add(new TextField({
    name: "isbn",
    required: false
  }));

  books.fields.add(new FileField({
    name: "cover",
    maxSelect: 1,
    maxSize: 5242880, // 5MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    required: false
  }));

  books.fields.add(new TextField({
    name: "cover_url",
    required: false
  }));

  books.fields.add(new TextField({
    name: "notes",
    required: false
  }));

  books.fields.add(new BoolField({
    name: "lendable",
    required: false
  }));

  books.fields.add(new SelectField({
    name: "status",
    values: ["available", "lent"],
    maxSelect: 1,
    required: false
  }));

  books.fields.add(new TextField({
    name: "lent_to",
    required: false
  }));

  books.fields.add(new DateField({
    name: "lent_at",
    required: false
  }));

  app.save(books);
}, (app) => {
  try {
    const books = app.findCollectionByNameOrId("books");
    app.delete(books);
  } catch (_) {}

  try {
    const shelves = app.findCollectionByNameOrId("shelves");
    app.delete(shelves);
  } catch (_) {}

  try {
    const users = app.findCollectionByNameOrId("users");
    users.fields.removeByName("gender");
    users.fields.removeByName("house_color");
    app.save(users);
  } catch (_) {}
});
