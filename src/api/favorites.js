import { apiDelete, apiGet, apiPost } from './client';

export function addFavorite(listingId) {
  return apiPost(`/listings/${listingId}/favorite`);
}

export function removeFavorite(listingId) {
  return apiDelete(`/listings/${listingId}/favorite`);
}

/** Favoritos guardados en la cuenta (requiere sesión). */
export function listFavorites() {
  return apiGet('/users/me/favorites');
}
