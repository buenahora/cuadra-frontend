/* Coordenadas mock para las pantallas geográficas (1B, 1E).
 *
 * El backend hoy devuelve todos los avisos con la misma lat/lng (o con null:
 * los avisos scrapeados no traen coordenadas -- ver ListingRow), así que
 * dibujar una zona o mover un radio no filtraría nada visible. Hasta que la
 * data layer geocodifique las direcciones, cada aviso se ubica acá: centroide
 * aproximado de su barrio + un desplazamiento determinístico derivado del id,
 * de modo que un mismo aviso caiga siempre en el mismo punto entre renders y
 * entre pantallas.
 *
 * Cuando el backend traiga lat/lng reales, alcanza con dejar de llamar a
 * withMockGeo() -- el resto de las pantallas ya trabaja sobre l.lat / l.lng.
 */

export const MONTEVIDEO_CENTER = [-34.9075, -56.1795];

// Centroides aproximados (relevados de OSM) de los barrios que aparecen en el
// catálogo de zonas del backend.
export const BARRIO_COORDS = {
  'ciudad vieja':            [-34.9068, -56.2064],
  'centro':                  [-34.9058, -56.1917],
  'cordon':                  [-34.9040, -56.1780],
  'palermo':                 [-34.9145, -56.1830],
  'barrio sur':              [-34.9110, -56.1930],
  'parque rodo':             [-34.9160, -56.1690],
  'punta carretas':          [-34.9265, -56.1560],
  'pocitos':                 [-34.9145, -56.1520],
  'pocitos nuevo':           [-34.9105, -56.1420],
  'buceo':                   [-34.9060, -56.1330],
  'puerto buceo':            [-34.9048, -56.1370],
  'puerto del buceo':        [-34.9048, -56.1370],
  'malvin':                  [-34.8930, -56.1120],
  'malvin norte':            [-34.8830, -56.1170],
  'punta gorda':             [-34.8940, -56.0830],
  'carrasco':                [-34.8880, -56.0570],
  'carrasco norte':          [-34.8750, -56.0640],
  'barra de carrasco':       [-34.8760, -56.0330],
  'playa grande':            [-34.8790, -56.0480],
  'parque batlle':           [-34.8955, -56.1620],
  'la blanqueada':           [-34.8880, -56.1600],
  'tres cruces':             [-34.8945, -56.1720],
  'larranaga':               [-34.8930, -56.1690],
  'aguada':                  [-34.8925, -56.1930],
  'reducto':                 [-34.8830, -56.1880],
  'villa munoz':             [-34.8890, -56.1830],
  'goes':                    [-34.8940, -56.1800],
  'bella vista':             [-34.8790, -56.1990],
  'capurro':                 [-34.8720, -56.2050],
  'capurro bella vista':     [-34.8745, -56.2020],
  'prado':                   [-34.8660, -56.1980],
  'atahualpa':               [-34.8710, -56.1880],
  'jacinto vera':            [-34.8790, -56.1740],
  'la comercial':            [-34.8850, -56.1740],
  'brazo oriental':          [-34.8660, -56.1790],
  'aires puros':             [-34.8500, -56.1900],
  'belvedere':               [-34.8600, -56.2260],
  'nuevo paris':             [-34.8570, -56.2450],
  'paso molino':             [-34.8620, -56.2140],
  'cerro':                   [-34.8850, -56.2440],
  'la teja':                 [-34.8720, -56.2320],
  'sayago':                  [-34.8380, -56.2020],
  'colon':                   [-34.7970, -56.2270],
  'peniarol':                [-34.8180, -56.2100],
  'penarol':                 [-34.8180, -56.2100],
  'union':                   [-34.8720, -56.1420],
  'villa espanola':          [-34.8620, -56.1550],
  'maronias':                [-34.8620, -56.1350],
  'maronas':                 [-34.8620, -56.1350],
  'flor de maronias':        [-34.8580, -56.1290],
  'flor de maronas':         [-34.8580, -56.1290],
  'jardines del hipodromo':  [-34.8480, -56.1250],
  'piedras blancas':         [-34.8210, -56.1400],
  'manga':                   [-34.8060, -56.1180],
  'las canteras':            [-34.8330, -56.0700],
  'paso carrasco':           [-34.8560, -56.0300],
  'lomas de solymar':        [-34.8320, -55.9500],
  'lomas solymar':           [-34.8320, -55.9500],
  'solymar':                 [-34.8390, -55.9550],
  'el pinar':                [-34.8180, -55.9060],
  'bello horizonte':         [-34.8250, -55.9100],
  'los angeles':             [-34.8330, -55.9700],
  'shangrila':               [-34.8410, -55.9760],
  'montevideo':              MONTEVIDEO_CENTER,
};

// ~600 m de dispersión dentro del barrio: alcanza para que los avisos no se
// apilen en un punto, sin sacarlos de la zona que dice el aviso.
const JITTER_LAT = 0.0055;
const JITTER_LNG = 0.0068;

function normalizar(nombre) {
  return (nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// FNV-1a + finalizador tipo murmur3: sin el mezclado final, ids consecutivos
// (o UUIDs que difieren en un caracter) caen casi en el mismo punto. Hash
// estable entre sesiones -- Math.random() movería los marcadores en cada render.
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

// Dos valores en [-1,1) derivados del mismo hash, sin correlación visible
// entre ellos (mitades distintas de los 32 bits).
function offsets(seed) {
  const h = hash32(seed);
  const a = ((h & 0xffff) / 0x10000) * 2 - 1;
  const b = (((h >>> 16) & 0xffff) / 0x10000) * 2 - 1;
  return [a, b];
}

/* Punto mock para un aviso. Sin barrio conocido, se reparte en un rectángulo
 * que cubre Montevideo en vez de quedar afuera del mapa. */
export function mockLatLng(id, barrio) {
  const seed = String(id ?? barrio ?? 'cuadra');
  const [a, b] = offsets(seed);
  const base = BARRIO_COORDS[normalizar(barrio)];
  if (!base) {
    return [
      MONTEVIDEO_CENTER[0] + a * 0.035,
      MONTEVIDEO_CENTER[1] + b * 0.075,
    ];
  }
  return [base[0] + a * JITTER_LAT, base[1] + b * JITTER_LNG];
}

/* Completa lat/lng mock en una lista de avisos del backend, respetando las
 * coordenadas reales si algún día llegan distintas entre sí. */
export function withMockGeo(items = []) {
  return items.map((l) => {
    const [lat, lng] = mockLatLng(l.id, l.barrio);
    return { ...l, lat, lng, _geoMock: true };
  });
}
