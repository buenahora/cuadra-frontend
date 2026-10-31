import { apiGet } from './client';

export function listZones() {
  return apiGet('/zones');
}
