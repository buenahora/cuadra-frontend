import { apiPost } from './client';
import { setToken, clearToken, getToken } from '../lib/token';
import * as cognito from '../lib/cognito';

/* Con el pool configurado (AWS) el login es el hosted UI de Cognito y estas
 * dos funciones de contraseña no se usan: la API les responde 404. Sin pool
 * (desarrollo) sigue el login propio contra /auth/register y /auth/login. */
export const usaCognito = cognito.estaConfigurado;

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

/* Sale del sitio: la vuelta la maneja procesarCallback() al recargar. */
export function entrarConGoogle() {
  return cognito.irALogin({ proveedor: 'Google' });
}

/* Pantalla de Cognito con las dos opciones (Google y email). */
export function entrarConCognito() {
  return cognito.irALogin();
}

export function logout() {
  if (cognito.estaConfigurado()) {
    // Cierra también la sesión del hosted UI; si no, volver a entrar la reusa
    // y parece que el logout no hizo nada.
    cognito.cerrarSesion();
    return;
  }
  clearToken();
}
