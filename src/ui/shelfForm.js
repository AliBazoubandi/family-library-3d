import { strings, t } from '../strings.js';
import { appState } from '../state.js';
import { createShelf, updateShelf, deleteShelf } from '../api/books.js';
import { showToast } from './toast.js';
import { esc } from './utils.js';

export function openShelfModal(shelfToEdit = null) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const isOwner = (appState.currentHouseUser?.id === appState.user?.id);
  if (!isOwner) {
    showToast(`You can only add or edit shelves in your own library!`, 'warning');
    return;
  }

  const isEdit = !!shelfToEdit;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  backdrop.innerHTML = `
    <div class="modal-dialog" style="max-width: 440px;">
      <div class="modal-header">
        <h3 class="modal-title">${isEdit ? strings.shelfForm.editShelfTitle : strings.shelfForm.addShelfTitle}</h3>
        <button type="button" class="btn-icon-sm" id="shelf-close-btn">✕</button>
      </div>

      <form id="shelf-form" class="modal-body">
        <div id="shelf-modal-error" class="form-error"></div>

        <div class="form-group">
          <label class="form-label" for="shelf-name">${strings.shelfForm.nameLabel}</label>
          <input 
            type="text" 
            id="shelf-name" 
            class="form-input" 
            required 
            placeholder="e.g. Science Fiction" 
            value="${esc(shelfToEdit?.name || '')}"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="shelf-category">${strings.shelfForm.categoryLabel}</label>
          <input 
            type="text" 
            id="shelf-category" 
            class="form-input" 
            required 
            placeholder="e.g. scifi" 
            value="${esc(shelfToEdit?.category || '')}"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="shelf-order">${strings.shelfForm.sortOrderLabel}</label>
          <input 
            type="number" 
            id="shelf-order" 
            class="form-input" 
            value="${esc(shelfToEdit?.sort_order ?? (appState.shelves.length + 1))}"
          />
        </div>

        ${isEdit ? `
          <p style="font-size: 0.78rem; color: var(--text-subtle);">
            ${strings.shelfForm.deleteShelfWarning}
          </p>
        ` : ''}
      </form>

      <div class="modal-footer">
        ${isEdit ? `
          <button type="button" id="shelf-delete-btn" class="btn btn-danger" style="margin-right: auto;">
            ${strings.app.delete}
          </button>
        ` : ''}
        <button type="button" id="shelf-cancel-btn" class="btn btn-secondary">
          ${strings.app.cancel}
        </button>
        <button type="button" id="shelf-save-btn" class="btn btn-primary">
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
  document.getElementById('shelf-close-btn').addEventListener('click', close);
  document.getElementById('shelf-cancel-btn').addEventListener('click', close);

  const nameInput = document.getElementById('shelf-name');
  const catInput = document.getElementById('shelf-category');
  const orderInput = document.getElementById('shelf-order');
  const errorBox = document.getElementById('shelf-modal-error');
  const saveBtn = document.getElementById('shelf-save-btn');

  saveBtn.addEventListener('click', async () => {
    if (!nameInput.value.trim() || !catInput.value.trim()) {
      errorBox.textContent = "Shelf name and category are required.";
      errorBox.className = 'form-error visible';
      return;
    }

    saveBtn.disabled = true;

    try {
      if (isEdit) {
        await updateShelf(shelfToEdit.id, {
          name: nameInput.value.trim(),
          category: catInput.value.trim().toLowerCase().replace(/\s+/g, '-'),
          sort_order: parseInt(orderInput.value, 10) || 0
        });
        showToast(t(strings.toast.shelfUpdated, { name: nameInput.value.trim() }), 'success');
      } else {
        await createShelf(
          nameInput.value.trim(),
          catInput.value.trim().toLowerCase().replace(/\s+/g, '-'),
          parseInt(orderInput.value, 10) || 0
        );
        showToast(t(strings.toast.shelfAdded, { name: nameInput.value.trim() }), 'success');
      }

      close();
      window.dispatchEvent(new CustomEvent('reload-data'));
    } catch (err) {
      console.error("Save shelf error:", err);
      errorBox.textContent = err.message || "Failed to save shelf.";
      errorBox.className = 'form-error visible';
      saveBtn.disabled = false;
    }
  });

  if (isEdit) {
    const delBtn = document.getElementById('shelf-delete-btn');
    delBtn.addEventListener('click', async () => {
      const confirmDelete = confirm(`Are you sure you want to delete shelf '${shelfToEdit.name}'?`);
      if (!confirmDelete) return;

      try {
        await deleteShelf(shelfToEdit.id);
        showToast(t(strings.toast.shelfDeleted, { name: shelfToEdit.name }), 'info');
        close();
        window.dispatchEvent(new CustomEvent('reload-data'));
      } catch (err) {
        console.error("Delete shelf error:", err);
        alert("Failed to delete shelf: " + err.message);
      }
    });
  }
}
