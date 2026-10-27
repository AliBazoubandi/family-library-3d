import { strings, t } from '../strings.js';
import { appState } from '../state.js';
import { getBookCoverUrl, markBookLent, markBookReturned, deleteBook, updateBook, moveBookToShelf } from '../api/books.js';
import { openBookModal } from './bookForm.js';
import { openShelfModal } from './shelfForm.js';
import { showToast } from './toast.js';
import { esc } from './utils.js';

export function renderShelfOverlay(shelfId, onBack) {
  const container = document.getElementById('ui-overlay');
  if (!container) return;

  // Remove existing overlay if any
  const existing = document.getElementById('shelf-overlay-root');
  if (existing) existing.remove();

  const shelf = appState.shelves.find(s => s.id === shelfId);
  if (!shelf) return;

  const overlayRoot = document.createElement('div');
  overlayRoot.id = 'shelf-overlay-root';
  overlayRoot.className = 'shelf-overlay-wrapper';

  const currentHouseUser = appState.currentHouseUser || appState.user;
  const isOwner = (currentHouseUser?.id === appState.user?.id);

  // Filter books belonging to this shelf
  let shelfBooks = appState.books.filter(b => b.shelf === shelfId);

  // Apply search query if present
  let localSearch = '';
  let localStatus = 'all';

  function updateCards() {
    const listContainer = overlayRoot.querySelector('.shelf-book-cards');
    if (!listContainer) return;

    let filtered = shelfBooks;

    if (localStatus !== 'all') {
      filtered = filtered.filter(b => b.status === localStatus);
    }

    if (localSearch.trim()) {
      const q = localSearch.trim().toLowerCase();
      filtered = filtered.filter(b =>
        (b.title || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.notes || '').toLowerCase().includes(q) ||
        (b.isbn || '').toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state" style="padding: 40px 20px; width: 100%;">
          <div class="empty-state-icon">📚</div>
          <p style="color: var(--text-muted); font-size: 0.95rem;">${strings.shelfOverlay.noBooksOnShelf}</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(book => {
      const coverUrl = getBookCoverUrl(book);
      const isLent = book.status === 'lent';

      return `
        <div class="shelf-book-card" data-book-id="${book.id}">
          <div class="card-cover-wrapper">
            ${coverUrl ? `
              <img src="${esc(coverUrl)}" alt="${esc(book.title)}" class="card-cover-img" loading="lazy" />
            ` : `
              <div class="card-cover-placeholder">📖</div>
            `}
          </div>

          <div class="card-content">
            <h4 class="card-title" title="${esc(book.title)}">${esc(book.title)}</h4>
            <p class="card-author">${esc(book.author)}</p>
            ${book.notes ? `<p class="card-notes">${esc(book.notes)}</p>` : ''}

            <div style="margin-top: auto; padding-top: 8px;">
              ${isLent ? `
                <span class="badge badge-lent">
                  ${t(strings.shelfOverlay.badgeLentTo, { name: esc(book.lent_to || 'Someone') })}
                </span>
              ` : `
                <span class="badge badge-available">
                  ${strings.shelfOverlay.badgeAvailable}
                </span>
              `}
            </div>

            <div class="card-actions">
              ${isOwner ? `
                <button 
                  type="button" 
                  class="btn btn-secondary shelf-toggle-lend-btn" 
                  data-id="${book.id}"
                  style="font-size: 0.78rem; padding: 4px 10px;"
                >
                  ${isLent ? strings.shelfOverlay.markReturned : strings.shelfOverlay.markLent}
                </button>
                
                <button 
                  type="button" 
                  class="btn-icon-sm shelf-move-book-btn" 
                  data-id="${book.id}" 
                  title="${strings.shelfOverlay.moveBook}"
                >
                  ⇄
                </button>

                <button 
                  type="button" 
                  class="btn-icon-sm shelf-edit-book-btn" 
                  data-id="${book.id}" 
                  title="${strings.shelfOverlay.editBook}"
                >
                  ✏
                </button>

                <button 
                  type="button" 
                  class="btn-icon-sm shelf-delete-book-btn" 
                  data-id="${book.id}" 
                  title="${strings.shelfOverlay.deleteBook}"
                  style="color: #fb7185;"
                >
                  🗑
                </button>
              ` : `
                <span class="visitor-book-tag">📖 ${esc(currentHouseUser.name)}'s Collection (Read-only)</span>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach card action listeners
    listContainer.querySelectorAll('.shelf-move-book-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const book = appState.books.find(b => b.id === btn.dataset.id);
        if (!book) return;

        const otherShelves = appState.shelves.filter(s => s.id !== shelfId);
        if (otherShelves.length === 0) {
          showToast("No other shelves available. Create a new shelf first!", "info");
          return;
        }

        const shelfOptionsText = otherShelves.map((s, i) => `${i + 1}. ${s.name}`).join('\n');
        const choice = prompt(`${t(strings.shelfOverlay.movePrompt, { title: book.title })}\n\n${shelfOptionsText}\n\nEnter shelf number:`, "1");
        if (choice === null) return;

        const idx = parseInt(choice, 10) - 1;
        if (idx >= 0 && idx < otherShelves.length) {
          const targetShelf = otherShelves[idx];
          try {
            await moveBookToShelf(book.id, targetShelf.id);
            showToast(t(strings.toast.bookMoved, { title: book.title, shelf: targetShelf.name }), 'success');
            window.dispatchEvent(new CustomEvent('reload-data'));
          } catch (err) {
            alert("Error moving book: " + err.message);
          }
        }
      });
    });

    listContainer.querySelectorAll('.shelf-edit-book-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const book = appState.books.find(b => b.id === btn.dataset.id);
        if (book) openBookModal(book, shelfId);
      });
    });

    listContainer.querySelectorAll('.shelf-delete-book-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const book = appState.books.find(b => b.id === btn.dataset.id);
        if (!book) return;
        if (confirm(t(strings.bookForm.deleteConfirm, { title: book.title }))) {
          try {
            await deleteBook(book.id);
            showToast(t(strings.toast.bookDeleted, { title: book.title }), 'info');
            window.dispatchEvent(new CustomEvent('reload-data'));
          } catch (err) {
            alert("Error deleting book: " + err.message);
          }
        }
      });
    });

    listContainer.querySelectorAll('.shelf-toggle-lend-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const book = appState.books.find(b => b.id === btn.dataset.id);
        if (!book) return;

        if (book.status === 'lent') {
          try {
            await markBookReturned(book.id);
            showToast(`'${book.title}' marked as returned!`, 'success');
            window.dispatchEvent(new CustomEvent('reload-data'));
          } catch (err) {
            alert("Error: " + err.message);
          }
        } else {
          const recipient = prompt("Enter the name of the person borrowing this book:", "Friend / Family");
          if (recipient !== null && recipient.trim() !== '') {
            try {
              await markBookLent(book.id, recipient.trim());
              showToast(`'${book.title}' lent to ${recipient.trim()}!`, 'success');
              window.dispatchEvent(new CustomEvent('reload-data'));
            } catch (err) {
              alert("Error: " + err.message);
            }
          }
        }
      });
    });
  }

  overlayRoot.innerHTML = `
    <div class="shelf-panel">
      <!-- Shelf Header -->
      <div class="shelf-header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <button type="button" id="shelf-back-btn" class="btn btn-secondary">
            ${strings.shelfOverlay.backToRoom}
          </button>
          <div>
            <h2 class="shelf-title">${esc(shelf.name)}</h2>
            <p class="shelf-sub">${shelfBooks.length} books on this shelf</p>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          ${isOwner ? `
            <button type="button" id="shelf-edit-shelf-btn" class="btn btn-ghost" title="Rename or edit shelf">
              ⚙ Edit Shelf
            </button>
            <button type="button" id="shelf-add-book-btn" class="btn btn-primary">
              ${strings.shelfOverlay.addBookToShelf}
            </button>
          ` : `
            <div class="visitor-mode-pill">
              👁️ ${esc(currentHouseUser.name)}'s Shelf (Read Only)
            </div>
          `}
        </div>
      </div>

      <!-- Shelf Toolbar -->
      <div class="shelf-toolbar">
        <div class="search-input-wrapper" style="flex: 1; min-width: 200px;">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            id="shelf-search-input" 
            class="form-input" 
            placeholder="Search this shelf..." 
          />
        </div>

        <div class="segmented-control">
          <button type="button" class="segment-btn active" data-status="all">
            ${strings.app.all}
          </button>
          <button type="button" class="segment-btn" data-status="available">
            ${strings.shelfOverlay.filterAvailableOnly}
          </button>
          <button type="button" class="segment-btn" data-status="lent">
            ${strings.shelfOverlay.filterLentOnly}
          </button>
        </div>
      </div>

      <!-- Books Cards Grid -->
      <div class="shelf-book-cards"></div>
    </div>
  `;

  container.appendChild(overlayRoot);

  // Wire buttons
  document.getElementById('shelf-back-btn').addEventListener('click', () => {
    overlayRoot.remove();
    if (onBack) onBack();
  });

  document.getElementById('shelf-add-book-btn').addEventListener('click', () => {
    openBookModal(null, shelfId);
  });

  document.getElementById('shelf-edit-shelf-btn').addEventListener('click', () => {
    openShelfModal(shelf);
  });

  const searchInput = document.getElementById('shelf-search-input');
  searchInput.addEventListener('input', (e) => {
    localSearch = e.target.value;
    updateCards();
  });

  overlayRoot.querySelectorAll('.segmented-control .segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      overlayRoot.querySelectorAll('.segmented-control .segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      localStatus = btn.dataset.status;
      updateCards();
    });
  });

  // Initial render of cards
  updateCards();

  // Listen to data reload
  const reloadHandler = () => {
    shelfBooks = appState.books.filter(b => b.shelf === shelfId);
    updateCards();
  };
  window.addEventListener('reload-data', reloadHandler);

  return () => {
    window.removeEventListener('reload-data', reloadHandler);
    overlayRoot.remove();
  };
}
