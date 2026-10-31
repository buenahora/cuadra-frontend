import { apiGet } from './client';

/** Estadística vigente por zona+tipología. Sin filtros devuelve todas las
 *  combinaciones con avisos activos -- útil para el ranking de barrios (3D). */
export function listMarketStats(params) {
  return apiGet('/market/stats', params);
}

/** Serie mensual de la mediana para el gráfico de tendencia (3D, 2A, 3A). */
export function listMarketSnapshots({ zone_id, dormitorios_bucket }) {
  return apiGet('/market/snapshots', { zone_id, dormitorios_bucket });
}
