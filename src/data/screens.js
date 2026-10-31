export const SCREEN_ORDER = [
  '1A','1B','1C','1F','LA','LB','1D','1D-ok','1E',
  '2A','2B','2C','2D','2E','2E-ok','2F','2G',
  '3A','3B','3C','3D',
];

export const GROUPS = {
  1: { name: 'Inquilino buscador', persona: 'Matías, 27, busca su primer apartamento desde el teléfono. Quiere saber si un precio es justo antes de contactar.' },
  2: { name: 'Propietario particular', persona: 'Carmen, 58, alquila su apartamento sin inmobiliaria. Necesita fijar un precio justo y publicar de forma simple.' },
  3: { name: 'Corredor inmobiliario', persona: 'Diego, 42, gestiona 20 propiedades. Necesita datos exportables para justificar valuaciones.' },
};

export const FLOWS = {
  1: {
    main: ['1A','1B','1C','1D','1D-ok'],
    branches: [
      { label: 'Búsqueda cerca de un punto', codes: ['1A','1E','1C'] },
      { label: 'Comparar desde resultados',  codes: ['1B','1F','1C'] },
    ],
  },
  2: {
    main: ['2A','2B','2C','2D','2E','2E-ok'],
    branches: [
      { label: 'Gestión de consultas', codes: ['2F','2G'] },
    ],
  },
  3: {
    main: ['3A','3C'],
    branches: [
      { label: 'Cartera → análisis', codes: ['3B','3A'] },
      { label: 'Análisis macro por barrio', codes: ['3D'] },
    ],
  },
};

/* Registry — populated by each screen file */
export const SCREENS = {};
export const reg = (code, group, title, comp) => { SCREENS[code] = { code, group, title, comp }; };

// El registry es estado de módulo: si HMR reemplaza este archivo sin volver a
// correr screens/index.js, las pantallas quedan sin registrar y toda ruta cae
// al fallback 1A. En dev preferimos un reload completo.
if (import.meta.hot) {
  import.meta.hot.accept(() => { window.location.reload(); });
}
