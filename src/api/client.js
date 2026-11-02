import { getToken } from '../lib/token';
import { renovarSiHaceFalta } from '../lib/cognito';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export class ApiError extends Error {
  constructor(status, body) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, v));
    } else {
      qs.append(key, value);
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

/* Async porque el ID token de Cognito dura una hora y hay que renovarlo
 * antes de usarlo. Sin pool configurado, renovarSiHaceFalta() no hace nada. */
async function authHeaders() {
  await renovarSiHaceFalta();
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path, params) {
  const res = await fetch(`${API_BASE}${path}${buildQuery(params)}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text().catch(() => null));
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text().catch(() => null));
  if (res.status === 204) return null;
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text().catch(() => null));
  return null;
}
