import { apiPost } from './client';
import { setToken, clearToken, getToken } from '../lib/token';

export function isAuthenticated() {
  return !!getToken();
}

export async function register({ nombre_completo, email, telefono, password }) {
  const data = await apiPost('/auth/register', { nombre_completo, email, telefono, password });
  setToken(data.access_token);
  return data.user;
}

export async function login({ email, password }) {
  const data = await apiPost('/auth/login', { email, password });
  setToken(data.access_token);
  return data.user;
}

export function logout() {
  clearToken();
}
