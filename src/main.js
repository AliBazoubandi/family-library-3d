import { isAuthenticated, getCurrentUser, onAuthChange } from './api/client.js';
import { fetchShelves, fetchBooks, fetchFamilyUsers } from './api/books.js';
import { appState } from './state.js';
import { renderLogin } from './ui/login.js';
import { renderNavBar } from './ui/navBar.js';
import { renderListView } from './ui/listView.js';
import { showToast } from './ui/toast.js';
import { SceneManager } from './scenes/sceneManager.js';

let sceneManager = null;

// Load user data (shelves, books, and family neighborhood members)
async function loadLibraryData() {
  if (!isAuthenticated()) return;
  try {
    const [shelves, books, familyUsers] = await Promise.all([
      fetchShelves(),
      fetchBooks(),
      fetchFamilyUsers()
    ]);
    appState.setFamilyUsers(familyUsers);
    appState.setShelves(shelves);
    appState.setBooks(books);
    if (!appState.currentHouseUser && appState.user) {
      appState.setCurrentHouseUser(appState.user);
    }
  } catch (err) {
    console.error("Failed to load library data:", err);
    showToast("Could not load library data from database.", "error");
  }
}

// Main application rendering orchestrator
function renderApp() {
  const overlay = document.getElementById('ui-overlay');
  const canvasContainer = document.getElementById('canvas-container');
  if (!overlay) return;

  const topNavContainer = document.getElementById('top-nav-container');

  if (!isAuthenticated()) {
    // Show login screen
    if (topNavContainer) topNavContainer.innerHTML = '';
    const existingList = document.getElementById('list-view-root');
    if (existingList) existingList.remove();
    const existingShelfOverlay = document.getElementById('shelf-overlay-root');
    if (existingShelfOverlay) existingShelfOverlay.remove();
    const existingHints = document.querySelectorAll('.scene-hint');
    existingHints.forEach(h => h.remove());

    if (sceneManager) {
      sceneManager.destroy();
      sceneManager = null;
      if (canvasContainer) canvasContainer.innerHTML = '';
    }

    renderLogin();
    return;
  }

  // Remove login overlay if present
  const authOverlay = document.getElementById('auth-overlay');
  if (authOverlay) authOverlay.remove();

  // Render navigation bar
  renderNavBar();

  // Initialize 3D Scene if authenticated and not yet created
  if (!sceneManager && canvasContainer) {
    sceneManager = new SceneManager(canvasContainer);
    window.__sceneManager = sceneManager;
  }

  // Handle active view: 3D scene vs 2D list view
  if (appState.currentView === 'list') {
    renderListView();
  } else {
    // When 3D view is active, remove 2D list view overlay
    const listView = document.getElementById('list-view-root');
    if (listView) listView.remove();
  }
}

// Global data refresh event
window.addEventListener('reload-data', async () => {
  await loadLibraryData();
  if (sceneManager) {
    sceneManager.rebuildScenes();
  }
  renderApp();
});

import { initLoadingScreen } from './ui/loadingScreen.js';

// App initialization
async function init() {
  const loading = initLoadingScreen();
  loading.updateProgress(25, "Connecting to PocketBase...");

  // Sync state with current auth
  const currentUser = getCurrentUser();
  appState.setUser(currentUser);

  // Listen for auth changes
  onAuthChange(async (record) => {
    appState.setUser(record);
    if (record) {
      await loadLibraryData();
    }
    renderApp();
  });

  // State change subscriber
  appState.subscribe((event) => {
    if (event === 'user') {
      renderApp();
    } else if (event === 'family' || event === 'houseUser') {
      renderNavBar();
    } else if (event === 'view') {
      renderNavBar();
      if (appState.currentView === 'list') {
        renderListView();
      } else {
        const listView = document.getElementById('list-view-root');
        if (listView) listView.remove();
      }
    } else if (event === 'filters' || event === 'books' || event === 'shelves') {
      if (appState.currentView === 'list') {
        renderListView();
      }
    }
  });

  if (isAuthenticated()) {
    loading.updateProgress(60, "Loading shelves & book collection...");
    appState.setView('3d');
    await loadLibraryData();
    loading.updateProgress(90, "Preparing cozy 3D neighborhood...");
  } else {
    loading.updateProgress(80, "Ready!");
  }

  renderApp();
  loading.updateProgress(100, "Welcome!");
  setTimeout(() => loading.hide(), 300);
}

// Start application
init().catch((err) => {
  console.error("Initialization error:", err);
  const loading = initLoadingScreen();
  loading.hide();
});
