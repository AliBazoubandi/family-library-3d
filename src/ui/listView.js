import { strings, t } from '../strings.js';
import { appState } from '../state.js';
import { getBookCoverUrl, markBookLent, markBookReturned, deleteBook, moveBookToShelf } from '../api/books.js';
import { openBookModal } from './bookForm.js';
import { openShelfModal } from './shelfForm.js';
import { showToast } from './toast.js';
import { esc } from './utils.js';

export function renderListView() {
  const container = document.getElementById('ui-overlay');
  if (!container) return;

  // Remove existing list view if re-rendering
  const existing = document.getElementById('list-view-root');
  if (existing) existing.remove();

  const listRoot = document.createElement('div');
  listRoot.id = 'list-view-root';
  listRoot.className = 'list-view-container';

  const currentHouseUser = appState.currentHouseUser || appState.user;
  const isOwner = (currentHouseUser?.id === appState.user?.id);

  // Filter books based on active search, shelf, and status filters
  const filteredBooks = appState.books.filter(book => {
    // Shelf filter
    if (appState.filterShelf !== 'all' && book.shelf !== appState.filterShelf) {
      return false;
    }
    // Status filter
    if (appState.filterStatus !== 'all' && book.status !== appState.filterStatus) {
      return false;
    }
    // Search filter
    if (appState.searchQuery) {
      const q = appState.searchQuery.toLowerCase();
      const titleMatch = (book.title || '').toLowerCase().includes(q);
      const authorMatch = (book.author || '').toLowerCase().includes(q);
      const isbnMatch = (book.isbn || '').toLowerCase().includes(q);
      const notesMatch = (book.notes || '').toLowerCase().includes(q);
      if (!titleMatch && !authorMatch && !isbnMatch && !notesMatch) {
        return false;
      }
    }
    return true;
  });

  listRoot.innerHTML = `
    <div class="list-header">
      <div class="list-title-group">
        <h2>${isOwner ? strings.listView.pageTitle : `${esc(currentHouseUser.name)}'s Library`}</h2>
        <p>${t(strings.listView.totalBooksCount, { count: filteredBooks.length })}</p>
      </div>

      <div style="display: flex; align-items: center; gap: 10px;">
        ${isOwner ? `
          <button type="button" id="list-add-shelf-btn" class="btn btn-secondary">
            ⚙ ${strings.shelfForm.addShelfTitle}
          </button>
          <button type="button" id="list-add-book-btn" class="btn btn-primary">
            ${strings.listView.addBookBtn}
          </button>
        ` : `
          <div class="visitor-mode-pill">
            👁️ Viewing ${esc(currentHouseUser.name)}'s Collection (Read-only)
          </div>
        `}
        <button type="button" id="list-to-3d-btn" class="btn btn-secondary" style="border-color: rgba(99, 102, 241, 0.4);">
          🎮 ${strings.nav.toggle3DView}
        </button>
      </div>
    </div>

    <!-- Toolbar: Search & Filters -->
    <div class="list-toolbar">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          id="list-search-input" 
          class="form-input" 
          placeholder="${strings.listView.searchPlaceholder}" 
          value="${esc(appState.searchQuery)}"
        />
      </div>

      <select id="list-shelf-filter" class="filter-select">
        <option value="all" ${appState.filterShelf === 'all' ? 'selected' : ''}>
          ${strings.listView.allShelves}
        </option>
        ${appState.shelves.map(s => `
          <option value="${s.id}" ${s.id === appState.filterShelf ? 'selected' : ''}>
            ${esc(s.name)}
          </option>
        `).join('')}
      </select>

      <div class="segmented-control">
        <button type="button" class="segment-btn ${appState.filterStatus === 'all' ? 'active' : ''}" data-status="all">
          ${strings.app.all}
        </button>
        <button type="button" class="segment-btn ${appState.filterStatus === 'available' ? 'active' : ''}" data-status="available">
          ${strings.listView.statusAvailable}
        </button>
        <button type="button" class="segment-btn ${appState.filterStatus === 'lent' ? 'active' : ''}" data-status="lent">
          ${strings.listView.statusLent}
        </button>
      </div>
    </div>

    <!-- Books Table -->
    <div class="table-scroll-wrapper">
      ${filteredBooks.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📖</div>
          <h3>${strings.listView.noBooksFound}</h3>
          <p style="margin-top: 6px;">Try adjusting your search terms or add a new book.</p>
        </div>
      ` : `
        <table class="books-table">
          <thead>
            <tr>
              <th style="width: 60px;">${strings.listView.colCover}</th>
              <th>${strings.listView.colTitle}</th>
              <th>${strings.listView.colAuthor}</th>
              <th>${strings.listView.colShelf}</th>
              <th>${strings.listView.colIsbn}</th>
              <th>${strings.listView.colStatus}</th>
              <th style="text-align: right;">${strings.listView.colActions}</th>
            </tr>
          </thead>
          <tbody>
            ${filteredBooks.map(book => {
              const coverUrl = getBookCoverUrl(book);
              const shelf = appState.shelves.find(s => s.id === book.shelf);
              const isLent = book.status === 'lent';

              return `
                <tr data-book-id="${book.id}">
                  <td>
                    ${coverUrl ? `
                      <img src="${esc(coverUrl)}" alt="${esc(book.title)}" class="book-cover-thumb" loading="lazy" />
                    ` : `
                      <div class="book-cover-placeholder">📖</div>
                    `}
                  </td>
                  <td>
                    <div class="book-title-cell">${esc(book.title)}</div>
                    ${book.notes ? `<div style="font-size: 0.78rem; color: var(--text-subtle); margin-top: 2px;">${esc(book.notes)}</div>` : ''}
                  </td>
                  <td>
                    <div class="book-author-cell">${esc(book.author)}</div>
                  </td>
                  <td>
                    <span class="badge badge-shelf">${shelf ? esc(shelf.name) : 'Unknown'}</span>
                  </td>
                  <td>
                    <span style="font-family: monospace; font-size: 0.8rem; color: var(--text-muted);">
                      ${esc(book.isbn) || '—'}
                    </span>
                  </td>
                  <td>
                    ${isLent ? `
                      <span class="badge badge-lent">
                        ${t(strings.shelfOverlay.badgeLentTo, { name: esc(book.lent_to || 'Someone') })}
                      </span>
                    ` : `
                      <span class="badge badge-available">
                        ${strings.shelfOverlay.badgeAvailable}
                      </span>
                    `}
                  </td>
                  <td>
                    <div class="actions-cell" style="justify-content: flex-end;">
                      ${isOwner ? `
                        <button 
                          type="button" 
                          class="btn btn-secondary toggle-lend-btn" 
                          data-id="${book.id}" 
                          data-status="${book.status}"
                          style="font-size: 0.78rem; padding: 4px 10px;"
                        >
                          ${isLent ? strings.shelfOverlay.markReturned : strings.shelfOverlay.markLent}
                        </button>
                        <button 
                          type="button" 
                          class="btn-icon-sm move-book-btn" 
                          data-id="${book.id}" 
                          title="${strings.shelfOverlay.moveBook}"
                        >
                          ⇄
                        </button>
                        <button 
                          type="button" 
                          class="btn-icon-sm edit-book-btn" 
                          data-id="${book.id}" 
                          title="${strings.shelfOverlay.editBook}"
                        >
                          ✏
                        </button>
                        <button 
                          type="button" 
                          class="btn-icon-sm delete-book-btn" 
                          data-id="${book.id}" 
                          title="${strings.shelfOverlay.deleteBook}"
                          style="color: #fb7185;"
                        >
                          🗑
                        </button>
                      ` : `
                        <span class="visitor-book-tag">📖 Read-only</span>
                      `}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;

  container.appendChild(listRoot);

  // Wire event handlers
  document.getElementById('list-add-book-btn').addEventListener('click', () => openBookModal());
  document.getElementById('list-add-shelf-btn').addEventListener('click', () => openShelfModal());

  // Switch to 3D View button
  document.getElementById('list-to-3d-btn').addEventListener('click', () => {
    appState.setView('3d');
  });

  // Search input with real-time filtering
  const searchInput = document.getElementById('list-search-input');
  searchInput.addEventListener('input', (e) => {
    appState.setFilters({ search: e.target.value });
  });

  // Shelf select filter
  const shelfSelect = document.getElementById('list-shelf-filter');
  shelfSelect.addEventListener('change', (e) => {
    appState.setFilters({ shelf: e.target.value });
  });

  // Status segment buttons
  listRoot.querySelectorAll('.segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.setFilters({ status: btn.dataset.status });
    });
  });

  // Row action buttons: Move, Edit, Delete, Toggle Lend/Return
  listRoot.querySelectorAll('.move-book-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const book = appState.books.find(b => b.id === btn.dataset.id);
      if (!book) return;

      const otherShelves = appState.shelves.filter(s => s.id !== book.shelf);
      if (otherShelves.length === 0) {
        showToast("No other shelves available.", "info");
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

  listRoot.querySelectorAll('.edit-book-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const book = appState.books.find(b => b.id === btn.dataset.id);
      if (book) openBookModal(book);
    });
  });

  listRoot.querySelectorAll('.delete-book-btn').forEach(btn => {
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

  listRoot.querySelectorAll('.toggle-lend-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const book = appState.books.find(b => b.id === btn.dataset.id);
      if (!book) return;

      if (book.status === 'lent') {
        // Return book
        try {
          await markBookReturned(book.id);
          showToast(`'${book.title}' marked as returned!`, 'success');
          window.dispatchEvent(new CustomEvent('reload-data'));
        } catch (err) {
          alert("Error: " + err.message);
        }
      } else {
        // Lend book prompt
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
