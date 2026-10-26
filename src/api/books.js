import { pb, getCurrentUser } from './client.js';

/**
 * Fetch all family members (users) registered in the neighborhood.
 */
export async function fetchFamilyUsers() {
  try {
    return await pb.collection('users').getFullList({
      sort: 'created'
    });
  } catch (err) {
    console.warn("Could not fetch family users:", err);
    const currentUser = getCurrentUser();
    return currentUser ? [currentUser] : [];
  }
}

/**
 * Fetch all shelves for a specified user (defaults to current user), ordered by sort_order.
 */
export async function fetchShelves(ownerId = null) {
  const targetId = ownerId || getCurrentUser()?.id;
  if (!targetId) return [];

  return await pb.collection('shelves').getFullList({
    filter: `owner = "${targetId}"`,
    sort: 'sort_order,id',
  });
}

/**
 * Fetch books for a user with optional shelf, search, and status filters.
 */
export async function fetchBooks(options = {}) {
  const targetId = options.ownerId || getCurrentUser()?.id;
  if (!targetId) return [];

  const filters = [`owner = "${targetId}"`];

  if (options.shelfId) {
    filters.push(`shelf = "${options.shelfId}"`);
  }

  if (options.status && options.status !== 'all') {
    filters.push(`status = "${options.status}"`);
  }

  if (options.search && options.search.trim()) {
    const q = options.search.trim().replace(/"/g, '\\"');
    filters.push(`(title ~ "${q}" || author ~ "${q}" || isbn ~ "${q}")`);
  }

  return await pb.collection('books').getFullList({
    filter: filters.join(' && '),
    expand: 'shelf',
    sort: '-id',
  });
}

/**
 * Create a new book record.
 */
export async function createBook(data) {
  const user = getCurrentUser();
  if (!user) throw new Error("Must be logged in to create a book");

  // If data is FormData, append owner
  if (data instanceof FormData) {
    data.set('owner', user.id);
    return await pb.collection('books').create(data);
  }

  return await pb.collection('books').create({
    ...data,
    owner: user.id
  });
}

/**
 * Update an existing book record.
 */
export async function updateBook(id, data) {
  return await pb.collection('books').update(id, data);
}

/**
 * Delete a book record by ID.
 */
export async function deleteBook(id) {
  return await pb.collection('books').delete(id);
}

/**
 * Quick toggle: Mark book as lent out to recipient.
 */
export async function markBookLent(id, lentTo) {
  return await pb.collection('books').update(id, {
    status: 'lent',
    lent_to: lentTo || 'Family Member',
    lent_at: new Date().toISOString()
  });
}

/**
 * Quick toggle: Mark book as returned (available).
 */
export async function markBookReturned(id) {
  return await pb.collection('books').update(id, {
    status: 'available',
    lent_to: '',
    lent_at: null
  });
}

/**
 * Create a new shelf.
 */
export async function createShelf(name, category, sortOrder = 0) {
  const user = getCurrentUser();
  if (!user) throw new Error("Must be logged in to create a shelf");

  return await pb.collection('shelves').create({
    owner: user.id,
    name,
    category,
    sort_order: sortOrder
  });
}

/**
 * Update shelf details.
 */
export async function updateShelf(id, data) {
  return await pb.collection('shelves').update(id, data);
}

/**
 * Delete a shelf by ID.
 */
export async function deleteShelf(id) {
  return await pb.collection('shelves').delete(id);
}

/**
 * Move a book to a different shelf.
 */
export async function moveBookToShelf(bookId, newShelfId) {
  return await pb.collection('books').update(bookId, {
    shelf: newShelfId
  });
}

/**
 * Get direct image URL for a book record (either uploaded file or external cover_url).
 */
export function getBookCoverUrl(book) {
  if (!book) return '';
  if (book.cover) {
    return pb.getFileUrl(book, book.cover, { thumb: '200x300' });
  }
  if (book.cover_url) {
    return book.cover_url;
  }
  return '';
}
