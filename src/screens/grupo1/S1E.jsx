import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { AdCard } from '../../components/AdCard';
import { MapView } from '../../components/ui/MapView';
import { PlaceSearch } from '../../components/ui/PlaceSearch';
import { Seg } from '../../components/ui/Controls';
import { Ic } from '../../components/ui/Ic';
import { listListings } from '../../api/listings';
import { reverseGeocode } from '../../api/geocode';
import { formatPrice, formatBeds, formatArea, marketLevel } from '../../lib/format';
import { haversineMeters, formatDistance, radiusFromBBox, zoomForRadius } from '../../lib/geo';
import { withMockGeo } from '../../data/mockGeo';

// Punto de arranque del mapa: el centro entre los barrios con más avisos. Es
// solo un encuadre inicial, no un lugar elegido -- el buscador arranca vacío.
const CENTRO_INICIAL = [-34.9083, -56.1670];
const RADIUS_M = { '500 m': 500, '1 km': 1000, '2 km': 2000, '5 km': 5000 };
const MAX_MARCADORES = 60;
const ZOOM_INICIAL = 13;
// Arrastrar el pin dispara un dragend por gesto, pero clickear el mapa varias
// veces seguidas encadenaría un reverse geocode por click: se espera a que la
// mano se quede quieta.
const REVERSE_DEBOUNCE_MS = 400;

export function S1E() {
  const { go } = useNav();
  const [centro, setCentro] = useState(CENTRO_INICIAL);
  const [radio, setRadio] = useState(1000);
  // Encuadre del mapa: solo se mueve cuando se elige un lugar en el buscador.
  // Tocar o arrastrar el pin no reencuadra (el usuario ya está mirando ahí).
  const [vista, setVista] = useState({ center: CENTRO_INICIAL, zoom: ZOOM_INICIAL });
  const [lugar, setLugar] = useState('');
  const [resolviendoLugar, setResolviendoLugar] = useState(false);
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // El radio se aplica en el cliente: /listings ya acepta lat/lng/radio_m,
        // pero hoy todos los avisos vienen en la misma coordenada (o sin
        // ninguna), así que mover el punto no cambiaría nada. Coordenadas mock
        // por ahora -- ver data/mockGeo.js.
        const page = await listListings({ page_size: 100, sort: 'recientes' });
        if (!cancelled) setPool(withMockGeo(page.items));
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const items = useMemo(() => (
    pool
      .map((l) => ({ ...l, _dist: haversineMeters(centro[0], centro[1], l.lat, l.lng) }))
      .filter((l) => l._dist <= radio)
      .sort((a, b) => a._dist - b._dist)
  ), [pool, centro, radio]);

  const marcadores = useMemo(
    () => items.slice(0, MAX_MARCADORES).map((l) => ({
      pos: [l.lat, l.lng],
      price: formatPrice(l.precio),
      id: l.id,
    })),
    [items],
  );

  // Cuando el punto se mueve tocando el mapa queremos mostrar la dirección
  // real, no un par de coordenadas. `pedidoRef` marca de dónde salió el centro
  // actual: si vino del buscador, ya sabemos cómo se llama y no hace falta ir
  // al geocoder.
  const pedidoRef = useRef('inicial');
  useEffect(() => {
    if (pedidoRef.current !== 'mapa') return;
    const ctrl = new AbortController();
    setResolviendoLugar(true);
    const t = setTimeout(() => {
      reverseGeocode(centro[0], centro[1], { signal: ctrl.signal })
        .then((p) => {
          setLugar(p ? [p.titulo, p.detalle.split(' · ')[0]].filter(Boolean).join(', ') : 'Punto elegido en el mapa');
        })
        .catch((err) => {
          if (err.name !== 'AbortError') setLugar('Punto elegido en el mapa');
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setResolviendoLugar(false);
        });
    }, REVERSE_DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [centro]);

  const moverDesdeMapa = useCallback((lat, lng) => {
    pedidoRef.current = 'mapa';
    setCentro([lat, lng]);
  }, []);

  const onMapClick = useCallback(({ lat, lng }) => moverDesdeMapa(lat, lng), [moverDesdeMapa]);

  const onCircleChange = useCallback(({ center, radius }) => {
    const nuevoRadio = Math.round(radius);
    setRadio(nuevoRadio);
    if (center[0] !== centro[0] || center[1] !== centro[1]) moverDesdeMapa(center[0], center[1]);
  }, [centro, moverDesdeMapa]);

  // Elegir un lugar del buscador recentra el mapa y encuadra el área: si el
  // lugar es un barrio o una ciudad el radio se ajusta a su tamaño; si es una
  // dirección puntual se respeta el radio que el usuario venía usando.
  const onSelectLugar = useCallback((place) => {
    pedidoRef.current = 'buscador';
    setResolviendoLugar(false);
    setCentro([place.lat, place.lng]);
    setLugar(place.titulo);
    const sugerido = radiusFromBBox(place.bbox);
    const nuevoRadio = sugerido ?? radio;
    if (sugerido) setRadio(sugerido);
    setVista({ center: [place.lat, place.lng], zoom: zoomForRadius(nuevoRadio) });
  }, [radio]);

  // El preset solo queda marcado si el radio sigue siendo exactamente el suyo:
  // arrastrando el manijo se llega a valores intermedios.
  const presetActivo = Object.keys(RADIUS_M).find((k) => RADIUS_M[k] === radio) ?? '';

  return (
    <Screen active="buscar">
      <div className="body" style={{ flex: 'none', height: 'calc(100vh - 64px)' }}>
        <div style={{ flex: '1 1 58%', padding: 20, position: 'relative' }}>
          <div className="map" style={{ height: '100%' }}>
            <MapView
              center={vista.center}
              zoom={vista.zoom}
              markers={marcadores}
              onMarkerClick={(m) => go('1C', { id: m.id })}
              circle={{ center: centro, radius: radio, label: 'tu punto' }}
              onCircleChange={onCircleChange}
              onMapClick={onMapClick}
              cursor="crosshair"
              style={{ height: '100%' }}
            />

            {/* z-index por encima de los panes de Leaflet (el de marcadores
                llega a 600 y el de popups a 700), si no el desplegable queda
                tapado por los pines. */}
            <div style={{
              position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
              width: 'min(520px, calc(100% - 40px))', zIndex: 900,
            }}>
              <PlaceSearch
                value={lugar}
                loading={resolviendoLugar}
                placeholder="Buscá una dirección, barrio o lugar"
                onSelect={onSelectLugar}
              />
            </div>

            <span className="legend" style={{ bottom: 14, left: 14, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Ic n="locate" size={14} /> Tocá o arrastrá el pin para mover el centro · arrastrá el punto del borde para el radio
            </span>
            {items.length > MAX_MARCADORES && (
              <span className="legend" style={{ bottom: 14, right: 14 }}>
                Mostrando {MAX_MARCADORES} de {items.length} en el mapa
              </span>
            )}
          </div>
        </div>

        <div style={{ flex: '1 1 42%', borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="pad" style={{ paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
            <h2 className="h2">Cerca de un punto</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, marginBottom: 8 }}>
              <span className="lbl">Radio de búsqueda</span>
              <span className="tag-note">{formatDistance(radio)}</span>
            </div>
            <Seg options={['500 m', '1 km', '2 km', '5 km']} value={presetActivo} onChange={(k) => setRadio(RADIUS_M[k])} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
              <h3 className="h3">{loading ? 'Buscando…' : `${items.length} apartamento${items.length === 1 ? '' : 's'}`}</h3>
              <span className="tag-note"><Ic n="walk" size={13} /> Orden: por distancia</span>
            </div>
          </div>
          <div className="scroll-y pad" style={{ display: 'grid', gap: 16, alignContent: 'start', flex: '1 1 auto', minHeight: 0 }}>
            {error && <p className="helper">No pudimos cargar los avisos. ¿Está corriendo el backend?</p>}
            {!loading && !error && items.length === 0 && <p className="helper">No hay apartamentos en este radio. Probá ampliarlo o mover el punto.</p>}
            {items.map((l) => (
              <AdCard
                key={l.id}
                row
                id={l.id}
                price={formatPrice(l.precio)}
                level={marketLevel(l.market_position)}
                beds={formatBeds(l.dormitorios)}
                area={formatArea(l.metraje_m2)}
                zone={l.barrio}
                dist={formatDistance(l._dist)}
                photoUrl={l.foto_portada}
              />
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}
