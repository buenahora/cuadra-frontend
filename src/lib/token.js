/* Guardado de la sesión en el navegador.
 *
 * Con Cognito son tres cosas y no una: el ID token (lo que viaja a la API),
 * el refresh token (para renovarlo sin volver a pasar por el login) y el
 * momento en que vence, que hace falta para saber cuándo renovar sin tener
 * que decodificar el JWT en cada request.
 *
 * Con el login propio solo se usa el primero y los otros dos quedan vacíos.
 *
 * Todo va envuelto en try/catch: en modo privado algunos navegadores tienen
 * localStorage pero tiran al escribir.
 */

const TOKEN_KEY   = 'cuadra_token';
const REFRESH_KEY = 'cuadra_refresh_token';
const EXPIRY_KEY  = 'cuadra_token_expiry';

function leer(clave) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    /* localStorage no disponible (modo privado, etc.) */
  }
}

function borrar(clave) {
  try {
    localStorage.removeItem(clave);
  } catch {
    /* localStorage no disponible (modo privado, etc.) */
  }
}

export function getToken() {
  return leer(TOKEN_KEY);
}

export function setToken(token) {
  escribir(TOKEN_KEY, token);
}

export function getRefreshToken() {
  return leer(REFRESH_KEY);
}

export function setRefreshToken(token) {
  escribir(REFRESH_KEY, token);
}

/* Segundos epoch en que vence el token que está guardado. */
export function getExpiry() {
  const valor = Number(leer(EXPIRY_KEY));
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

export function setExpiry(epochSegundos) {
  escribir(EXPIRY_KEY, String(epochSegundos));
}

export function clearToken() {
  borrar(TOKEN_KEY);
  borrar(REFRESH_KEY);
  borrar(EXPIRY_KEY);
}
