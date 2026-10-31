export function formatPrice(value) {
  if (value == null) return '—';
  const rounded = Math.round(value);
  return '$' + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatBeds(n) {
  if (n == null) return '';
  return n === 0 ? 'Monoambiente' : `${n} dorm`;
}

export function formatArea(m2) {
  // 0 no es un tamaño real -- las fuentes scrapeadas lo usan como "sin dato"
  // (ver data_layer: listings_unified no siempre captura metraje).
  if (m2 == null || m2 === 0) return '';
  return `${m2} m²`;
}

export function marketLevel(position) {
  return position?.nivel ?? null;
}

// Los scrapers traen la descripción con tags HTML crudos (<br>, <p>, <strong>, ...).
// Como se renderiza como texto de React (nunca dangerouslySetInnerHTML), no hay
// riesgo de XSS -- pero sin esto el usuario ve los tags literales en pantalla.
export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<\s*(br|\/p|\/div|\/li)\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
