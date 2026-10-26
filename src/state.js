import { getCurrentUser } from './api/client.js';

class AppState {
  constructor() {
    this.user = getCurrentUser();
    this.familyUsers = [];
    this.currentHouseUser = this.user;
    this.currentView = '3d'; // '3d' or 'list'
    this.currentScene = 'STREET'; // 'STREET' | 'HOUSE_FRONT' | 'INSIDE' | 'SHELF_VIEW'
    this.selectedShelfId = null;
    this.shelves = [];
    this.books = [];
    this.searchQuery = '';
    this.filterStatus = 'all'; // 'all' | 'available' | 'lent'
    this.filterShelf = 'all';
    this.listeners = new Set();
  }

  setUser(user) {
    this.user = user;
    if (!this.currentHouseUser) {
      this.currentHouseUser = user;
    }
    this.notify('user');
  }

  setFamilyUsers(users) {
    this.familyUsers = users;
    this.notify('family');
  }

  setCurrentHouseUser(user) {
    this.currentHouseUser = user;
    this.notify('houseUser');
  }

  setView(view) {
    if (this.currentView !== view) {
      this.currentView = view;
      this.notify('view');
    }
  }

  setScene(scene, shelfId = null) {
    this.currentScene = scene;
    this.selectedShelfId = shelfId;
    this.notify('scene');
  }

  setShelves(shelves) {
    this.shelves = shelves;
    this.notify('shelves');
  }

  setBooks(books) {
    this.books = books;
    this.notify('books');
  }

  setFilters({ search, status, shelf }) {
    if (search !== undefined) this.searchQuery = search;
    if (status !== undefined) this.filterStatus = status;
    if (shelf !== undefined) this.filterShelf = shelf;
    this.notify('filters');
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event) {
    for (const listener of this.listeners) {
      try {
        listener(event, this);
      } catch (err) {
        console.error("State listener error:", err);
      }
    }
  }

  getSelectedShelf() {
    if (!this.selectedShelfId) return null;
    return this.shelves.find(s => s.id === this.selectedShelfId) || null;
  }
}

export const appState = new AppState();
