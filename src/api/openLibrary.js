/**
 * Open Library API wrapper for ISBN lookup.
 * Directly queries Open Library books API with graceful failure and timeout.
 */

export async function lookupIsbn(isbnRaw) {
  if (!isbnRaw) return null;

  // Clean raw ISBN: strip hyphens, spaces, letters other than 'X'
  const isbn = isbnRaw.toString().trim().replace(/[^0-9X]/gi, '');
  if (isbn.length !== 10 && isbn.length !== 13) {
    throw new Error("ISBN should be 10 or 13 digits");
  }

  const bibKey = `ISBN:${isbn}`;
  const url = `https://openlibrary.org/api/books?bibkeys=${bibKey}&jscmd=data&format=json`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open Library returned status ${response.status}`);
    }

    const data = await response.json();
    const bookData = data[bibKey];

    if (!bookData) {
      return null;
    }

    // Extract authors string
    const authors = Array.isArray(bookData.authors)
      ? bookData.authors.map(a => a.name).join(', ')
      : (bookData.by_statement || '');

    // Extract best available cover
    let coverUrl = '';
    if (bookData.cover) {
      coverUrl = bookData.cover.large || bookData.cover.medium || bookData.cover.small || '';
    } else {
      // Direct cover service fallback
      coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    }

    return {
      isbn,
      title: bookData.title || '',
      author: authors,
      coverUrl,
      notes: bookData.subtitle ? `Subtitle: ${bookData.subtitle}` : '',
      publishDate: bookData.publish_date || '',
      numberOfPages: bookData.number_of_pages || null
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("Open Library lookup failed or timed out:", err.message);
    // Return null so frontend can fallback gracefully to manual input
    return null;
  }
}
