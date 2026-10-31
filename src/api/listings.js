import { apiGet } from './client';

export function listListings(params) {
  return apiGet('/listings', params);
}

export function getListing(id) {
  return apiGet(`/listings/${id}`);
}
