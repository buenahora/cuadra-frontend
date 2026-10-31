import { useSyncExternalStore } from 'react';
import { isAuthenticated } from '../api/auth';
import { addFavorite, removeFavorite } from '../api/favorites';

const KEY = 'cuadra_favoritos';

let cache = null;
const listeners = new Set();

function read() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(ids) {
  cache = ids;
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* modo privado */ }
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  // Otra pestaña puede tocar la misma lista.
  const onStorage = (e) => { if (e.key === KEY) { cache = null; listener(); } };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function getFavorites() {
  return read();
}

/** Con sesión además se persiste en la cuenta (POST/DELETE /listings/{id}/favorite).
 *  Sin sesión la lista vive solo en este navegador: guardar y comparar no
 *  exigen cuenta, que es justo el gancho para el inquilino que recién llega. */
function syncBackend(listingId, added) {
  if (!isAuthenticated()) return;
  (added ? addFavorite : removeFavorite)(listingId).catch(() => {});
}

export function toggleFavorite(id) {
  const ids = read();
  const added = !ids.includes(id);
  write(added ? [...ids, id] : ids.filter((x) => x !== id));
  syncBackend(id, added);
  return added;
}

export function dropFavorite(id) {
  const ids = read();
  if (!ids.includes(id)) return;
  write(ids.filter((x) => x !== id));
  syncBackend(id, false);
}

export function useFavorites() {
  return useSyncExternalStore(subscribe, getFavorites, getFavorites);
}
