export function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters) {
  if (meters == null) return '';
  return meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1)} km`;
}

/* Ray casting sobre el anillo [[lat,lng], ...]. Mismo criterio que
 * app/services/geo.py:point_in_polygon en el backend, para que dibujar una
 * zona acá y mandarla a /listings/search dé el mismo conjunto. */
export function pointInPolygon(lat, lng, ring) {
  if (!ring || ring.length < 3) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lngI] = ring[i];
    const [latJ, lngJ] = ring[j];
    const cruza = latI > lat !== latJ > lat;
    if (!cruza) continue;
    const lngEnCorte = lngI + ((lat - latI) / (latJ - latI)) * (lngJ - lngI);
    if (lng < lngEnCorte) inside = !inside;
  }
  return inside;
}

/* Punto a `meters` de (lat,lng) con rumbo `bearingDeg` (0 = norte).
 * Se usa para colocar el manijo de radio en el borde del círculo. */
export function destinationPoint(lat, lng, meters, bearingDeg) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const d = meters / R;
  const brg = toRad(bearingDeg);
  const lat1 = toRad(lat);
  const lng1 = toRad(lng);
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brg));
  const lng2 = lng1 + Math.atan2(
    Math.sin(brg) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
  );
  return [toDeg(lat2), toDeg(lng2)];
}

/* En qué índice insertar un vértice nuevo para que el polígono no se cruce:
 * el de la arista más cercana al click, medido en metros sobre una proyección
 * plana local (a escala de barrio el error es despreciable). */
export function nearestEdgeIndex(lat, lng, ring) {
  if (!ring || ring.length < 3) return ring ? ring.length : 0;
  const kLng = Math.cos((lat * Math.PI) / 180);
  const xy = ([la, ln]) => [ln * kLng, la];
  const [px, py] = xy([lat, lng]);
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const [ax, ay] = xy(ring[i]);
    const [bx, by] = xy(ring[(i + 1) % ring.length]);
    const dx = bx - ax;
    const dy = by - ay;
    const largo2 = dx * dx + dy * dy;
    const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / largo2));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    const dist = (px - cx) ** 2 + (py - cy) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best + 1;
}

/* Área del polígono en km² (shoelace sobre la misma proyección local). */
export function polygonAreaKm2(ring) {
  if (!ring || ring.length < 3) return 0;
  const latMedia = ring.reduce((acc, p) => acc + p[0], 0) / ring.length;
  const mPorGradoLat = 111320;
  const mPorGradoLng = 111320 * Math.cos((latMedia * Math.PI) / 180);
  let suma = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lngI] = ring[i];
    const [latJ, lngJ] = ring[j];
    suma += (lngJ * mPorGradoLng) * (latI * mPorGradoLat) - (lngI * mPorGradoLng) * (latJ * mPorGradoLat);
  }
  return Math.abs(suma / 2) / 1e6;
}

export function formatAreaKm2(km2) {
  if (!km2) return '';
  return km2 < 1 ? `${Math.round(km2 * 100) / 100} km²` : `${km2.toFixed(1)} km²`;
}

/* ── Encuadre a partir de un resultado de geocoding ── */

// Mismos topes que el manijo de radio en MapView.
export const RADIO_MIN_M = 150;
export const RADIO_MAX_M = 15000;
// Debajo de esto el bbox es el de una dirección puntual (una puerta, una
// esquina): no dice nada sobre qué radio quiere buscar el usuario.
const BBOX_MINIMO_UTIL_M = 300;
const RADIOS_LINDOS = [250, 500, 750, 1000, 1500, 2000, 3000, 5000, 8000, 12000, RADIO_MAX_M];

/* Radio que cubre el bbox de un lugar, o null si el lugar es puntual y
 * conviene respetar el radio que el usuario ya venía usando.
 * bbox llega como [sur, norte, oeste, este]. */
export function radiusFromBBox(bbox) {
  if (!bbox || bbox.some((n) => !Number.isFinite(n))) return null;
  const [sur, norte, oeste, este] = bbox;
  const alto = haversineMeters(sur, oeste, norte, oeste);
  const ancho = haversineMeters(sur, oeste, sur, este);
  // Media geométrica de los lados, no media diagonal: la diagonal sobreestima
  // (para un barrio deja medio barrio vecino adentro del círculo).
  const radio = Math.sqrt(alto * ancho) / 2;
  if (radio < BBOX_MINIMO_UTIL_M) return null;
  // Se ajusta al valor lindo más cercano (no al siguiente hacia arriba): es un
  // punto de partida, el usuario después arrastra el manijo.
  const tope = Math.min(radio, RADIO_MAX_M);
  return RADIOS_LINDOS.reduce((a, b) => (Math.abs(b - tope) < Math.abs(a - tope) ? b : a));
}

/* Zoom con el que el círculo de `radio` entra cómodo en el panel del mapa. */
export function zoomForRadius(radio) {
  if (radio <= 300) return 16;
  if (radio <= 800) return 15;
  if (radio <= 1600) return 14;
  if (radio <= 3200) return 13;
  if (radio <= 6500) return 12;
  return 11;
}
