import { apiPost } from './client';

export function createInquiry(listingId, payload) {
  return apiPost(`/listings/${listingId}/inquiries`, payload);
}
