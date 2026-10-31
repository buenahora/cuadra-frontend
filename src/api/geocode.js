/* Geocoding sobre datos de OpenStreetMap (los mismos que dibujan las tiles de
 * CARTO en MapView), sin API key.
 *
 * Se usa Photon y no Nominatim: Nominatim resuelve la consulta por palabras
 * completas, así que mientras se tipea ("Poci", "18 de jul", "Tres Cru")
 * devuelve cero resultados y el autocompletado no sirve para nada. Photon está
 * hecho justamente para buscar a medida que se escribe.
 *
 * Nominatim queda de respaldo por si la instancia pública de Photon se cae:
 * con la consulta ya completa da resultados equivalentes.
 */

const PHOTON = 'https://photon.komoot.io';
const NOMINATIM = 'https://nominatim.openstreetmap.org';

// Área metropolitana de Montevideo (Montevideo + Ciudad de la Costa + Las
// Piedras), como minLon,minLat,maxLon,maxLat. En Photon el bbox filtra: acota
// la búsqueda a donde hay avisos, que es lo que evita que "Rivera" traiga una
// calle en la frontera con Brasil.
const BBOX = '-56.60,-35.05,-55.40,-34.55';
// Centro aproximado del área con más avisos: ordena por cercanía a esto.
const BIAS = { lat: -34.905, lon: -56.19 };

// Con dos caracteres ya hay consultas útiles ("18", "Br").
export const MIN_QUERY = 2;

function calleConNumero(p) {
  return [p.street, p.housenumber].filter(Boolean).join(' ');
}

/* Photon devuelve los campos sueltos (name, street, district, city…): el
 * título es el nombre propio del lugar y el detalle lo ubica, sin repetir lo
 * que ya dice el título. */
function fromPhoton(feature, i) {
  const p = feature.properties || {};
  const [lng, lat] = feature.geometry?.coordinates || [];
  const calle = calleConNumero(p);
  const titulo = p.name || calle || p.district || p.city || p.state || 'Lugar sin nombre';

  const vistos = new Set([titulo.toLowerCase()]);
  const detalle = [calle, p.district, p.city, p.state, p.country]
    .filter(Boolean)
    .filter((x) => {
      const k = x.toLowerCase();
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    })
    .slice(0, 3)
    .join(' · ');

  return {
    // osm_id puede repetirse entre un nodo y su vía: el índice lo desempata.
    id: `${p.osm_type || 'x'}${p.osm_id || ''}-${i}`,
    titulo,
    detalle,
    lat: Number(lat),
    lng: Number(lng),
    // Photon: extent = [oeste, norte, este, sur]. Normalizado a [sur, norte, oeste, este].
    bbox: Array.isArray(p.extent) && p.extent.length === 4
      ? [p.extent[3], p.extent[1], p.extent[0], p.extent[2]].map(Number)
      : null,
  };
}

function fromNominatim(r, i) {
  const partes = String(r.display_name || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const titulo = (r.name || '').trim() || partes[0] || 'Lugar sin nombre';
  const resto = (partes[0] === titulo ? partes.slice(1) : partes).filter((p) => !/^\d+$/.test(p));

  return {
    id: `n${r.place_id ?? i}-${i}`,
    titulo,
    detalle: resto.slice(0, 3).join(' · '),
    lat: Number(r.lat),
    lng: Number(r.lon),
    // Nominatim ya lo da como [sur, norte, oeste, este].
    bbox: Array.isArray(r.boundingbox) && r.boundingbox.length === 4
      ? r.boundingbox.map(Number)
      : null,
  };
}

/* OSM suele tener el mismo lugar dos veces (el nodo del barrio y su polígono),
 * y Photon devuelve los dos: en el desplegable se ven como dos filas idénticas.
 * Se deja una sola, prefiriendo la que trae extensión, que es la que después
 * permite encuadrar el área en vez de dejar el radio como está. */
function dedupe(places) {
  const orden = [];
  const porClave = new Map();
  for (const p of places) {
    const clave = `${p.titulo}|${p.detalle}`.toLowerCase();
    const previo = porClave.get(clave);
    if (!previo) {
      porClave.set(clave, p);
      orden.push(clave);
    } else if (!previo.bbox && p.bbox) {
      porClave.set(clave, { ...p, id: previo.id });
    }
  }
  return orden.map((k) => porClave.get(k));
}

async function json(url, signal) {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`El buscador de lugares respondió ${res.status}`);
  return res.json();
}

/* Autocompletado: lugares reales para el texto tipeado, ordenados por
 * cercanía al centro de Montevideo. */
export async function searchPlaces(query, { signal, limit = 6 } = {}) {
  const q = query.trim();
  if (q.length < MIN_QUERY) return [];

  const params = new URLSearchParams({
    q,
    limit: String(limit),
    lang: 'default', // Photon no tiene español; "default" usa el nombre local, que ya lo es
    lat: String(BIAS.lat),
    lon: String(BIAS.lon),
    zoom: '13',
    location_bias_scale: '1',
    bbox: BBOX,
  });

  try {
    const data = await json(`${PHOTON}/api/?${params}`, signal);
    return dedupe((data.features || []).map(fromPhoton).filter((p) => Number.isFinite(p.lat)));
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    const alt = new URLSearchParams({
      q,
      format: 'jsonv2',
      'accept-language': 'es',
      limit: String(limit),
      countrycodes: 'uy',
      addressdetails: '1',
    });
    const data = await json(`${NOMINATIM}/search?${alt}`, signal);
    return dedupe((Array.isArray(data) ? data : []).map(fromNominatim));
  }
}

/* Camino inverso: el usuario tocó el mapa y queremos mostrar una dirección de
 * verdad en vez de un par de coordenadas. */
export async function reverseGeocode(lat, lng, { signal } = {}) {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lng), lang: 'default', limit: '1' });
  try {
    const data = await json(`${PHOTON}/reverse?${params}`, signal);
    const f = (data.features || [])[0];
    return f ? fromPhoton(f, 0) : null;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    const alt = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'jsonv2',
      'accept-language': 'es',
      zoom: '18',
      addressdetails: '1',
    });
    const data = await json(`${NOMINATIM}/reverse?${alt}`, signal);
    return data && !data.error ? fromNominatim(data, 0) : null;
  }
}
