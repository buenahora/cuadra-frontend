/* Login contra el hosted UI de Cognito, con "Entrar con Google".
 *
 * Flujo authorization code + PKCE. El cliente del pool es público (un SPA no
 * puede guardar un secreto), así que en vez de un client secret se manda un
 * `code_verifier`: se guarda un valor al azar antes de salir, se manda su
 * hash en el /authorize y el valor original recién en el /token. Quien
 * intercepte el código de la URL no puede canjearlo sin el verifier.
 *
 * La vuelta cae en la raíz del sitio y no en /auth/callback porque la app
 * rutea por hash y CloudFront no tiene fallback de SPA: cualquier otro path
 * daría 404 de S3 antes de que cargue nada. Cognito manda el código como
 * query string (?code=...), que el router por hash ignora, así que lo lee
 * procesarCallback() al arrancar.
 *
 * A la API se le manda el ID token, no el access token: es el único que trae
 * email y nombre, que es lo que el backend necesita para dar de alta a la
 * persona la primera vez (ver app/core/cognito.py).
 */

import { setToken, clearToken, setRefreshToken, getRefreshToken, setExpiry, getExpiry } from './token';

const DOMINIO   = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;

const SCOPES = 'openid email profile';
const CLAVE_VERIFIER = 'cuadra_pkce_verifier';
// Margen para no mandar un token que vence en el viaje de ida.
const MARGEN_RENOVACION_S = 60;

export function estaConfigurado() {
  return !!(DOMINIO && CLIENT_ID);
}

function redirectUri() {
  // Tiene que coincidir carácter por carácter con CallbackURLs del pool.
  return `${window.location.origin}/`;
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function nuevoVerifier() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

async function challengeDe(verifier) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(hash);
}

/* Manda al hosted UI. `proveedor: 'Google'` saltea la pantalla de Cognito y
 * va derecho a Google; sin proveedor se muestra la pantalla con las dos
 * opciones. */
export async function irALogin({ proveedor } = {}) {
  if (!estaConfigurado()) throw new Error('Cognito no está configurado');

  const verifier = nuevoVerifier();
  // sessionStorage y no localStorage: el verifier sirve para este viaje y
  // nada más, y así no queda dando vueltas en otras pestañas.
  sessionStorage.setItem(CLAVE_VERIFIER, verifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: await challengeDe(verifier),
  });
  if (proveedor) params.set('identity_provider', proveedor);

  window.location.assign(`https://${DOMINIO}/oauth2/authorize?${params}`);
}

async function pedirTokens(body) {
  const resp = await fetch(`https://${DOMINIO}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
  });
  if (!resp.ok) throw new Error(`Cognito respondió ${resp.status} al pedir los tokens`);
  return resp.json();
}

function guardar(tokens) {
  setToken(tokens.id_token);
  // En la renovación Cognito no reemite el refresh token: se conserva el que ya había.
  if (tokens.refresh_token) setRefreshToken(tokens.refresh_token);
  setExpiry(Math.floor(Date.now() / 1000) + Number(tokens.expires_in || 3600));
}

/* Se llama una vez al arrancar la app. Devuelve true si esta carga era la
 * vuelta del login, para que quien llame sepa que hay sesión nueva. */
export async function procesarCallback() {
  if (!estaConfigurado()) return false;

  const query = new URLSearchParams(window.location.search);
  const code = query.get('code');
  const error = query.get('error');
  if (!code && !error) return false;

  // La URL se limpia pase lo que pase: dejar el código a la vista invita a
  // recargar y reintentar un canje que Cognito ya no acepta (es de un solo uso).
  const limpia = window.location.pathname + window.location.hash;
  window.history.replaceState({}, '', limpia);

  if (error) throw new Error(query.get('error_description') || error);

  const verifier = sessionStorage.getItem(CLAVE_VERIFIER);
  sessionStorage.removeItem(CLAVE_VERIFIER);
  if (!verifier) throw new Error('Se perdió el verificador del login: probá de nuevo');

  guardar(await pedirTokens({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  }));
  return true;
}

/* Renueva el ID token si está por vencer. La devuelve el cliente de la API
 * antes de cada request; si no hay nada que hacer, no cuesta nada. */
export async function renovarSiHaceFalta() {
  if (!estaConfigurado()) return;

  const vence = getExpiry();
  if (!vence || vence - MARGEN_RENOVACION_S > Date.now() / 1000) return;

  const refresh = getRefreshToken();
  if (!refresh) return cerrarSesionLocal();

  try {
    guardar(await pedirTokens({ grant_type: 'refresh_token', refresh_token: refresh }));
  } catch {
    // El refresh token vence a los 30 días o lo revocaron: no hay forma de
    // recuperarlo sin volver a entrar.
    cerrarSesionLocal();
  }
}

export function cerrarSesionLocal() {
  clearToken();
}

/* Cierra también la sesión en Cognito. Sin esto, "salir" y volver a entrar
 * reusa la sesión del hosted UI y parece que el logout no funcionó. */
export function cerrarSesion() {
  cerrarSesionLocal();
  if (!estaConfigurado()) return;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri: `${window.location.origin}/`,
  });
  window.location.assign(`https://${DOMINIO}/logout?${params}`);
}
