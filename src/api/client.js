import PocketBase, { LocalAuthStore } from 'pocketbase';

// PocketBase client instance with dedicated storage key 'family_library_auth'
// This isolates user auth from the PocketBase Admin dashboard ('pocketbase_auth')
// so logging into http://127.0.0.1:8090/_/ as superuser will NEVER conflict with
// the web application.
const authStore = new LocalAuthStore('family_library_auth');
export const pb = new PocketBase(window.location.origin, authStore);

/**
 * Returns currently authenticated user record from 'users' collection or null.
 */
export function getCurrentUser() {
  const record = pb.authStore.record;
  if (record && record.collectionName === 'users') {
    return record;
  }
  return null;
}

/**
 * Checks if user is currently authenticated as a valid 'users' record.
 */
export function isAuthenticated() {
  if (!pb.authStore.isValid || !pb.authStore.record) {
    return false;
  }
  // Must be a member of the 'users' collection
  if (pb.authStore.record.collectionName !== 'users') {
    pb.authStore.clear();
    return false;
  }
  return true;
}

/**
 * Sign in with email and password into 'users' collection.
 */
export async function login(email, password) {
  let targetEmail = email.trim();
  if (targetEmail.toLowerCase() === 'ali@library.local' || targetEmail.toLowerCase() === 'ali') {
    targetEmail = 'owner@library.local';
  }
  const authData = await pb.collection('users').authWithPassword(targetEmail, password);
  return authData.record;
}

/**
 * Sign out and clear stored authentication state.
 */
export function logout() {
  pb.authStore.clear();
}

/**
 * Subscribe to auth state changes (login, logout, token refresh).
 */
export function onAuthChange(callback) {
  return pb.authStore.onChange((token, model) => {
    const isValidUser = model && model.collectionName === 'users';
    callback(isValidUser ? model : null, !!token && isValidUser);
  });
}
