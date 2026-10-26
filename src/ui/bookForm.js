import { strings, t } from '../strings.js';
import { appState } from '../state.js';
import { createBook, updateBook, deleteBook, getBookCoverUrl } from '../api/books.js';
import { lookupIsbn } from '../api/openLibrary.js';
import { showToast } from './toast.js';

export function openBookModal(bookToEdit = null, defaultShelfId = null) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const isOwner = (appState.currentHouseUser?.id === appState.user?.id);
  if (!isOwner) {
    showToast(`You can only add or edit books in your own library!`, 'warning');
    return;
  }

  const isEdit = !!bookToEdit;
  const activeShelfId = bookToEdit?.shelf || defaultShelfId || (appState.shelves[0]?.id || '');

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  backdrop.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">${isEdit ? strings.bookForm.editTitle : strings.bookForm.addTitle}</h3>
        <button type="button" class="btn-icon-sm" id="modal-close-btn">✕</button>
      </div>

      <form id="book-form" class="modal-body">
        <div id="modal-error" class="form-error"></div>

        <!-- ISBN Lookup section -->
        <div class="form-group" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
          <label class="form-label" for="book-isbn">${strings.bookForm.isbnLabel}</label>
          <div style="display: flex; gap: 8px;">
            <input 
              type="text" 
              id="book-isbn" 
              class="form-input" 
              placeholder="e.g. 9780156012195" 
              value="${bookToEdit?.isbn || ''}"
            />
            <button type="button" id="isbn-lookup-btn" class="btn btn-secondary" style="font-size: 0.8rem;">
              ${strings.bookForm.lookupIsbn}
            </button>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-subtle); margin-top: 4px;">
            ${strings.bookForm.isbnHelp}
          </span>
        </div>

        <div class="form-group">
          <label class="form-label" for="book-title">${strings.bookForm.titleLabel}</label>
          <input 
            type="text" 
            id="book-title" 
            class="form-input" 
            required 
            value="${bookToEdit?.title || ''}"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="book-author">${strings.bookForm.authorLabel}</label>
          <input 
            type="text" 
            id="book-author" 
            class="form-input" 
            required 
            value="${bookToEdit?.author || ''}"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="book-shelf">${strings.bookForm.shelfLabel}</label>
          <select id="book-shelf" class="form-select" required>
            ${appState.shelves.map(s => `
              <option value="${s.id}" ${s.id === activeShelfId ? 'selected' : ''}>
                ${s.name}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="book-cover-url">${strings.bookForm.coverUrlLabel}</label>
          <input 
            type="url" 
            id="book-cover-url" 
            class="form-input" 
            placeholder="https://..." 
            value="${bookToEdit?.cover_url || ''}"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="book-cover-file">${strings.bookForm.coverUploadLabel}</label>
          <input 
            type="file" 
            id="book-cover-file" 
            class="form-input" 
            accept="image/*"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="book-notes">${strings.bookForm.notesLabel}</label>
          <textarea id="book-notes" class="form-textarea" placeholder="Personal notes, quotes, or thoughts...">${bookToEdit?.notes || ''}</textarea>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label" for="book-status">${strings.bookForm.statusLabel}</label>
            <select id="book-status" class="form-select">
              <option value="available" ${(bookToEdit?.status || 'available') === 'available' ? 'selected' : ''}>Available</option>
              <option value="lent" ${bookToEdit?.status === 'lent' ? 'selected' : ''}>Lent Out</option>
            </select>
          </div>

          <div class="form-group" id="lent-to-wrapper" style="display: ${bookToEdit?.status === 'lent' ? 'flex' : 'none'};">
            <label class="form-label" for="book-lent-to">${strings.bookForm.lentToLabel}</label>
            <input 
              type="text" 
              id="book-lent-to" 
              class="form-input" 
              placeholder="e.g. Sarah" 
              value="${bookToEdit?.lent_to || ''}"
            />
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
          <input 
            type="checkbox" 
            id="book-lendable" 
            ${(bookToEdit?.lendable ?? true) ? 'checked' : ''}
          />
          <label for="book-lendable" style="font-size: 0.85rem; color: var(--text-muted); cursor: pointer;">
            ${strings.bookForm.lendableLabel}
          </label>
        </div>
      </form>

      <div class="modal-footer">
        ${isEdit ? `
          <button type="button" id="book-delete-btn" class="btn btn-danger" style="margin-right: auto;">
            ${strings.app.delete}
          </button>
        ` : ''}
        <button type="button" id="modal-cancel-btn" class="btn btn-secondary">
          ${strings.app.cancel}
        </button>
        <button type="button" id="modal-save-btn" class="btn btn-primary">
          ${strings.app.save}
        </button>
      </div>
    </div>
  `;

  modalRoot.appendChild(backdrop);

  const close = () => backdrop.remove();

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  document.getElementById('modal-close-btn').addEventListener('click', close);
  document.getElementById('modal-cancel-btn').addEventListener('click', close);

  // Status toggle handler
  const statusSelect = document.getElementById('book-status');
  const lentToWrapper = document.getElementById('lent-to-wrapper');
  statusSelect.addEventListener('change', () => {
    lentToWrapper.style.display = statusSelect.value === 'lent' ? 'flex' : 'none';
  });

  // Open Library ISBN Lookup handler
  const isbnBtn = document.getElementById('isbn-lookup-btn');
  const isbnInput = document.getElementById('book-isbn');
  const titleInput = document.getElementById('book-title');
  const authorInput = document.getElementById('book-author');
  const coverUrlInput = document.getElementById('book-cover-url');
  const notesInput = document.getElementById('book-notes');
  const errorBox = document.getElementById('modal-error');

  isbnBtn.addEventListener('click', async () => {
    const raw = isbnInput.value.trim();
    if (!raw) {
      errorBox.textContent = "Please enter an ISBN number first.";
      errorBox.className = 'form-error visible';
      return;
    }

    isbnBtn.disabled = true;
    isbnBtn.textContent = strings.bookForm.lookingUp;
    errorBox.className = 'form-error';

    try {
      const data = await lookupIsbn(raw);
      if (data) {
        if (data.title && !titleInput.value) titleInput.value = data.title;
        if (data.author && !authorInput.value) authorInput.value = data.author;
        if (data.coverUrl && !coverUrlInput.value) coverUrlInput.value = data.coverUrl;
        if (data.notes && !notesInput.value) notesInput.value = data.notes;
        showToast(strings.bookForm.isbnSuccess, 'success');
      } else {
        errorBox.textContent = strings.bookForm.isbnNotFound;
        errorBox.className = 'form-error visible';
      }
    } catch (err) {
      errorBox.textContent = err.message || strings.bookForm.isbnNotFound;
      errorBox.className = 'form-error visible';
    } finally {
      isbnBtn.disabled = false;
      isbnBtn.textContent = strings.bookForm.lookupIsbn;
    }
  });

  // Save book handler
  const saveBtn = document.getElementById('modal-save-btn');
  saveBtn.addEventListener('click', async () => {
    if (!titleInput.value.trim() || !authorInput.value.trim()) {
      errorBox.textContent = "Title and Author are required fields.";
      errorBox.className = 'form-error visible';
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = strings.bookForm.saving;

    try {
      const fileInput = document.getElementById('book-cover-file');
      const isLent = statusSelect.value === 'lent';

      const formData = new FormData();
      formData.append('title', titleInput.value.trim());
      formData.append('author', authorInput.value.trim());
      formData.append('shelf', document.getElementById('book-shelf').value);
      formData.append('isbn', isbnInput.value.trim());
      formData.append('cover_url', coverUrlInput.value.trim());
      formData.append('notes', notesInput.value.trim());
      formData.append('lendable', document.getElementById('book-lendable').checked);
      formData.append('status', statusSelect.value);
      formData.append('lent_to', isLent ? document.getElementById('book-lent-to').value.trim() : '');
      formData.append('lent_at', isLent ? (bookToEdit?.lent_at || new Date().toISOString()) : '');

      if (fileInput.files.length > 0) {
        formData.append('cover', fileInput.files[0]);
      }

      if (isEdit) {
        await updateBook(bookToEdit.id, formData);
        showToast(t(strings.toast.bookUpdated, { title: titleInput.value.trim() }), 'success');
      } else {
        await createBook(formData);
        showToast(t(strings.toast.bookAdded, { title: titleInput.value.trim() }), 'success');
      }

      close();
      // Reload books to update state
      window.dispatchEvent(new CustomEvent('reload-data'));
    } catch (err) {
      console.error("Save book error:", err);
      errorBox.textContent = err.message || "Failed to save book. Please check inputs.";
      errorBox.className = 'form-error visible';
      saveBtn.disabled = false;
      saveBtn.textContent = strings.app.save;
    }
  });

  // Delete book handler
  if (isEdit) {
    const deleteBtn = document.getElementById('book-delete-btn');
    deleteBtn.addEventListener('click', async () => {
      const confirmDelete = confirm(t(strings.bookForm.deleteConfirm, { title: bookToEdit.title }));
      if (!confirmDelete) return;

      try {
        await deleteBook(bookToEdit.id);
        showToast(t(strings.toast.bookDeleted, { title: bookToEdit.title }), 'info');
        close();
        window.dispatchEvent(new CustomEvent('reload-data'));
      } catch (err) {
        console.error("Delete book error:", err);
        alert("Failed to delete book: " + err.message);
      }
    });
  }
}
