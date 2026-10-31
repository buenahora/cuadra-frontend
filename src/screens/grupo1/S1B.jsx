import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { AdCard } from '../../components/AdCard';
import { MapView } from '../../components/ui/MapView';
import { Btn } from '../../components/ui/Btn';
import { Ic } from '../../components/ui/Ic';
import { Seg } from '../../components/ui/Controls';
import { listListings } from '../../api/listings';
import { formatPrice, formatBeds, formatArea, marketLevel } from '../../lib/format';
import { pointInPolygon, nearestEdgeIndex, polygonAreaKm2, formatAreaKm2 } from '../../lib/geo';
import { withMockGeo, MONTEVIDEO_CENTER } from '../../data/mockGeo';
import { BARRIO_BOUNDARIES } from '../../data/barrioBoundaries';

/* Zona de arranque cuando no llega un barrio desde 3D (búsqueda libre, "1A" o
 * entrada directa): corredor Centro - Cordón - Parque Rodó - Pocitos, para que
 * la pantalla entre con una zona ya dibujada (igual que el mock original) y se
 * vea el efecto del filtro antes de tocar nada. "Limpiar" la borra. */
const ZONA_GENERICA = [
  [-34.8980, -56.1950],
  [-34.8965, -56.1620],
  [-34.9060, -56.1450],
  [-34.9230, -56.1480],
  [-34.9210, -56.1880],
  [-34.9090, -56.2010],
];

// Con más marcadores el mapa del corredor central se vuelve ilegible.
const MAX_MARCADORES = 60;

export function S1B() {
  const { go, params } = useNav();
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Si "Ver avisos" vino de 3D con un barrio, el mapa arranca encuadrado en
  // sus límites reales (ver data/barrioBoundaries.js) y con esa forma ya
  // dibujada como zona editable; si no, cae en la zona genérica de siempre.
  const barrio = params.zone_id ? BARRIO_BOUNDARIES[params.zone_id] : null;
  // Centro del bbox: se le pasa a MapView como `center` inicial (además de
  // `bounds`) para que el mapa nunca arranque sin una vista válida mientras
  // el fitBounds hace el encuadre preciso.
  const centroBarrio = barrio
    ? [(barrio.bounds[0][0] + barrio.bounds[1][0]) / 2, (barrio.bounds[0][1] + barrio.bounds[1][1]) / 2]
    : null;
  const [ring, setRing] = useState(barrio ? barrio.ring : ZONA_GENERICA);
  const [modo, setModo] = useState('Dibujar');
  // Distingue "zona del barrio, tal cual llegó de 3D" de "el usuario la tocó":
  // solo en el segundo caso tiene sentido decir "zona dibujada por vos".
  const [tocada, setTocada] = useState(false);

  // Si cambia el barrio elegido (volver a 3D y entrar a otro), se vuelve a
  // dibujar la zona de ese barrio en vez de arrastrar la anterior. Se ajusta
  // en el render (no en un efecto) siguiendo el patrón de React para
  // "resetear estado cuando cambia una prop": https://react.dev/learn/you-might-not-need-an-effect
  const [zoneIdVisto, setZoneIdVisto] = useState(params.zone_id);
  if (params.zone_id !== zoneIdVisto) {
    setZoneIdVisto(params.zone_id);
    setRing(barrio ? barrio.ring : ZONA_GENERICA);
    setTocada(false);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // Se traen los avisos de una y el filtro por zona se resuelve en el
        // cliente: el backend ya expone POST /listings/search con polígono,
        // pero hoy devuelve todos los avisos en la misma coordenada, así que
        // filtrar allá no mostraría nada. Las coordenadas son mock por ahora
        // (ver data/mockGeo.js); cuando la data layer geocodifique de verdad,
        // esto pasa a ser una llamada con el polígono.
        const p = await listListings({ q: params.q, zone_id: params.zone_id, page_size: 100, sort: 'recientes' });
        if (!cancelled) setPool(withMockGeo(p.items));
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params.q, params.zone_id]);

  const zonaActiva = ring.length >= 3;

  const items = useMemo(
    () => (zonaActiva ? pool.filter((l) => pointInPolygon(l.lat, l.lng, ring)) : pool),
    [pool, ring, zonaActiva],
  );
  const total = items.length;

  const marcadores = useMemo(
    () => items.slice(0, MAX_MARCADORES).map((l) => ({
      pos: [l.lat, l.lng],
      price: formatPrice(l.precio),
      id: l.id,
    })),
    [items],
  );

  /* Click en el mapa:
   * - con menos de 3 vértices se agrega al final (se está trazando)
   * - con la zona ya cerrada, el vértice entra en la arista más cercana, para
   *   que la forma se estire hacia donde tocaste en vez de cruzarse
   * - un click adentro de la zona no la modifica (es un click "de paso") */
  const onMapClick = useCallback(({ lat, lng }) => {
    if (modo !== 'Dibujar') return;
    setTocada(true);
    setRing((prev) => {
      if (prev.length < 3) return [...prev, [lat, lng]];
      if (pointInPolygon(lat, lng, prev)) return prev;
      const at = nearestEdgeIndex(lat, lng, prev);
      const next = prev.slice();
      next.splice(at, 0, [lat, lng]);
      return next;
    });
  }, [modo]);

  const onPolygonChange = (next) => { setTocada(true); setRing(next); };
  const deshacer = () => { setTocada(true); setRing((prev) => prev.slice(0, -1)); };
  const limpiar = () => { setTocada(true); setRing([]); };

  const areaKm2 = zonaActiva ? polygonAreaKm2(ring) : 0;
  const ayuda = !ring.length
    ? 'Tocá el mapa para marcar el primer vértice de tu zona'
    : !zonaActiva
      ? `Marcá ${3 - ring.length} vértice${3 - ring.length === 1 ? '' : 's'} más para cerrar la zona`
      : modo === 'Dibujar'
        ? 'Tocá afuera para ampliar · arrastrá un vértice para ajustar · clickealo para borrarlo'
        : 'Arrastrá el mapa para moverte · los vértices se siguen pudiendo ajustar';

  return (
    <Screen active="buscar">
      <div className="body" style={{ flex: 'none', height: 'calc(100vh - 64px)' }}>
        <div style={{ flex: '1 1 58%', padding: 20, position: 'relative' }}>
          <div className="map" style={{ height: '100%' }}>
            <MapView
              center={barrio ? centroBarrio : MONTEVIDEO_CENTER}
              zoom={13}
              bounds={barrio ? barrio.bounds : null}
              markers={marcadores}
              onMarkerClick={(m) => go('1C', { id: m.id })}
              polygon={ring}
              onPolygonChange={onPolygonChange}
              onMapClick={onMapClick}
              cursor={modo === 'Dibujar' ? 'crosshair' : 'grab'}
              style={{ height: '100%' }}
            />

            {/* Controles de dibujo */}
            <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Seg options={['Dibujar', 'Mover']} value={modo} onChange={setModo} />
                <Btn sm icon="left" onClick={deshacer} disabled={!ring.length}>Deshacer</Btn>
                <Btn sm icon="close" onClick={limpiar} disabled={!ring.length}>Limpiar</Btn>
              </div>
              <span className="legend" style={{ position: 'static', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Ic n="draw" size={14} /> {ayuda}
              </span>
            </div>

            {/* Resumen de la zona */}
            {zonaActiva && (
              <span className="legend" style={{ bottom: 14, left: 14, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Ic n="pin" size={14} />
                {barrio && !tocada && params.zone_name ? `Límites de ${params.zone_name}` : 'Zona dibujada por vos'}
                {' · '}{ring.length} vértices · {formatAreaKm2(areaKm2)}
              </span>
            )}
            {items.length > MAX_MARCADORES && (
              <span className="legend" style={{ bottom: 14, right: 14 }}>
                Mostrando {MAX_MARCADORES} de {total} en el mapa
              </span>
            )}
          </div>
        </div>

        <div style={{ flex: '1 1 42%', borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="pad" style={{ paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="h2">
                {loading
                  ? 'Buscando…'
                  : `${total} apartamento${total === 1 ? '' : 's'}${
                      zonaActiva
                        ? (barrio && !tocada && params.zone_name ? ` en ${params.zone_name}` : ' en tu zona')
                        : params.zone_name ? ` en ${params.zone_name}` : params.q ? ` para "${params.q}"` : ' en Montevideo'
                    }`}
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn sm icon="sliders" onClick={() => go('1F')}>Comparar</Btn>
                <Btn sm icon="sort">Ordenar</Btn>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <Btn sm>1 dorm</Btn>
              <Btn sm>2 dorm</Btn>
              <Btn sm>hasta $20.000</Btn>
              <Btn sm variant="ghost" icon="filter">+ filtros</Btn>
            </div>
          </div>
          <div className="scroll-y pad" style={{ display: 'grid', gap: 16, alignContent: 'start', flex: '1 1 auto', minHeight: 0 }}>
            {error && <p className="helper">No pudimos cargar los avisos. ¿Está corriendo el backend?</p>}
            {!loading && !error && items.length === 0 && (
              <p className="helper">
                {zonaActiva
                  ? `Ningún apartamento cae en ${barrio && !tocada && params.zone_name ? params.zone_name : 'la zona que dibujaste'}. Probá ampliarla o tocá "Limpiar".`
                  : 'No hay resultados.'}
              </p>
            )}
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
                photoUrl={l.foto_portada}
              />
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}
