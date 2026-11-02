/* Tiles del mapa base (CARTO Positron / light_all).
 *
 * CARTO pasó a exigir una key: sin ella el servidor igual responde 200, pero
 * la imagen que manda es un cartel que dice "API KEY REQUIRED" -- el mapa se
 * ve roto sin que falle ninguna request. El parámetro es `key`, no `api_key`.
 *
 * La key es de frontend: viaja en el bundle y cualquiera la puede leer. Lo que
 * la protege es la restricción por dominio en el panel de CARTO, no esconderla.
 * Vive en una variable de entorno igual para no quedar pegada al código y
 * poder rotarla sin tocar fuentes.
 */

const HOST = 'basemaps.cartocdn.com';
const STYLE = 'light_all';

const KEY = import.meta.env.VITE_CARTO_API_KEY;

if (!KEY && import.meta.env.DEV) {
  console.warn(
    '[mapa] Falta VITE_CARTO_API_KEY. CARTO va a devolver tiles con la marca ' +
    '"API KEY REQUIRED". Copiá la key en cuadra-frontend/.env (ver .env.example).',
  );
}

// Sin key no se agrega el parámetro vacío: así el cartel de CARTO queda como
// síntoma evidente en vez de un 400 que no dice nada.
const QS = KEY ? `?key=${encodeURIComponent(KEY)}` : '';

/* Plantilla para L.tileLayer: Leaflet sustituye {s} {z} {x} {y} y {r} (@2x en
 * pantallas retina). */
export const TILE_URL_TEMPLATE = `https://{s}.${HOST}/${STYLE}/{z}/{x}/{y}{r}.png${QS}`;

export const TILE_SUBDOMAINS = 'abcd';

/* URL de un tile puntual, para los <img> del mapa decorativo, que no pasan por
 * Leaflet y por eso no pueden usar la plantilla. */
export function tileUrl(z, x, y, subdomain = 'a') {
  return `https://${subdomain}.${HOST}/${STYLE}/${z}/${x}/${y}.png${QS}`;
}
