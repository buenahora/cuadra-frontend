import { useState, useEffect, useRef } from 'react';
import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { AdCard } from '../../components/AdCard';
import { MapView } from '../../components/ui/MapView';
import { Btn } from '../../components/ui/Btn';
import { Ic } from '../../components/ui/Ic';
import { listListings } from '../../api/listings';
import { listZones } from '../../api/catalogs';
import { isAuthenticated } from '../../api/auth';
import { formatPrice, formatBeds, formatArea, marketLevel } from '../../lib/format';
import { useFavorites } from '../../lib/favorites';

const CENTER = [-34.9083, -56.1670]; // centro entre los barrios con más volumen
const MAX_ZONE_SUGGESTIONS = 8;

export function S1A() {
  const { go } = useNav();
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zones, setZones] = useState([]);
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);
  const favoritos = useFavorites();
  const blurTimeout = useRef(null);
  const authenticated = isAuthenticated();

  // Mismo gancho que "Publicar" en el NavBar: sin sesión, manda a login con el destino guardado.
  const goPublicar = () => (authenticated ? go('2A') : go('LA', { redirect: '2A' }));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const page = await listListings({ sort: 'recientes', page_size: 6 });
        if (!cancelled) setListings(page.items);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listZones()
      .then((zs) => { if (!cancelled) setZones(zs); })
      .catch(() => { if (!cancelled) setZones([]); });
    return () => { cancelled = true; };
  }, []);

  const markers = listings
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => ({ pos: [l.lat, l.lng], price: formatPrice(l.precio), id: l.id }));

  const zoneSuggestions = zones
    .filter((z) => !query.trim() || z.nombre.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => b.cantidad_avisos - a.cantidad_avisos || a.nombre.localeCompare(b.nombre))
    .slice(0, MAX_ZONE_SUGGESTIONS);

  const openZoneDropdown = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setZoneDropdownOpen(true);
  };

  const closeZoneDropdownDelayed = () => {
    blurTimeout.current = setTimeout(() => setZoneDropdownOpen(false), 150);
  };

  const selectZone = (zone) => {
    setQuery(zone.nombre);
    setZoneDropdownOpen(false);
    go('1B', { zone_id: zone.id, zone_name: zone.nombre });
  };

  const submitSearch = () => {
    if (query.trim()) go('1B', { q: query.trim() });
  };

  return (
    <Screen active="buscar">
      <div className="body" style={{ flexDirection: 'column' }}>

        {/* Mapa interactivo */}
        <div style={{ position: 'relative', height: 520 }}>
          <MapView
            center={CENTER}
            zoom={13}
            markers={markers}
            onMarkerClick={(marker) => go('1C', { id: marker.id })}
            style={{ borderRadius: 0 }}
          />

          {/* Barra de búsqueda flotante */}
          <div style={{
            position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)',
            width: 600, display: 'flex', flexDirection: 'column', gap: 14,
            alignItems: 'center', zIndex: 1000,
          }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <div className="field" style={{ width: '100%', boxShadow: 'var(--shadow-lg)', fontSize: 16, padding: '14px 16px' }}>
                <Ic n="search" size={18} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={openZoneDropdown}
                  onClick={openZoneDropdown}
                  onBlur={closeZoneDropdownDelayed}
                  onKeyDown={e => { if (e.key === 'Enter') { setZoneDropdownOpen(false); submitSearch(); } }}
                  placeholder="Buscá por zona o dirección"
                  style={{
                    border: 'none', outline: 'none', background: 'transparent',
                    flex: 1, fontSize: 15, fontFamily: 'var(--sans)', color: 'var(--ink)', minWidth: 0,
                  }}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 0, display: 'flex' }}
                  >
                    <Ic n="close" size={16} />
                  </button>
                )}
              </div>

              {zoneDropdownOpen && zoneSuggestions.length > 0 && (
                <div
                  className="card"
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                    boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 1001,
                  }}
                >
                  {zoneSuggestions.map((zone) => (
                    <button
                      key={zone.id}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => selectZone(zone)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '11px 16px', border: 'none', background: 'none',
                        cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--line)',
                        font: 'inherit', color: 'var(--ink)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5 }}>
                        <Ic n="pin" size={15} />
                        {zone.nombre}
                      </span>
                      <span className="helper">
                        {zone.cantidad_avisos} aviso{zone.cantidad_avisos === 1 ? '' : 's'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Btn variant="primary" icon="draw" onClick={() => go('1B')}>Dibujar zona en el mapa</Btn>
              <Btn icon="locate" onClick={() => go('1E')}>Buscar cerca de un punto</Btn>
            </div>
          </div>
        </div>

        {/* Listado reciente */}
        <div className="pad" style={{ paddingTop: 22, paddingBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
            <h2 className="h2">Apartamentos recientes</h2>
            <Btn
              sm
              icon="bookmark"
              variant={favoritos.length ? 'primary' : undefined}
              disabled={!favoritos.length}
              onClick={() => go('1F')}
            >
              {favoritos.length ? `Comparar guardados (${favoritos.length})` : 'Sin guardados todavía'}
            </Btn>
          </div>
          {error && <p className="helper">No pudimos cargar los avisos. ¿Está corriendo el backend?</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            {loading
              ? <span className="helper">Cargando…</span>
              : listings.slice(0, 6).map((l) => (
                  <AdCard
                    key={l.id}
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

        {/* Gancho para propietarios */}
        <div
          style={{
            width: '100%', background: 'var(--clay)', color: '#fff',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            gap: 20, padding: '56px 28px', marginTop: 48,
          }}
        >
          <div>
            <h1 className="h1" style={{ marginBottom: 8, color: '#fff' }}>¿Tenés un apartamento para alquilar?</h1>
            <p className="lbl" style={{ fontSize: 16, color: 'rgba(255,255,255,.85)' }}>Publicalo gratis y conocé el precio justo antes de publicar.</p>
          </div>
          <Btn icon="plus" onClick={goPublicar} style={{ background: '#fff', borderColor: '#fff', color: 'var(--clay-deep)' }}>
            Quiero publicar mi apartamento
          </Btn>
        </div>
      </div>
    </Screen>
  );
}
