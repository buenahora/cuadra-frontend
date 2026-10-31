import { useState, useEffect } from 'react';
import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { Photo } from '../../components/ui/Photo';
import { Btn } from '../../components/ui/Btn';
import { Ic } from '../../components/ui/Ic';
import { MarketChip } from '../../components/ui/MarketChip';
import { MarketBar } from '../../components/ui/MarketBar';
import { MapView } from '../../components/ui/MapView';
import { getListing, listListings } from '../../api/listings';
import { formatPrice, formatBeds, formatArea, marketLevel, stripHtml } from '../../lib/format';
import { useFavorites, toggleFavorite } from '../../lib/favorites';

const THUMBS_PER_PAGE = 5;

export function S1C() {
  const { go, toast, params } = useNav();
  const [active, setActive] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const favoritos = useFavorites();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setActive(0);
      setThumbStart(0);
      try {
        const l = params.id
          ? await getListing(params.id)
          : await (async () => {
              const page = await listListings({ page_size: 1 });
              if (!page.items.length) throw new Error('Sin avisos disponibles');
              return getListing(page.items[0].id);
            })();
        if (!cancelled) setListing(l);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => { cancelled = true; };
  }, [params.id]);

  if (loading) {
    return (
      <Screen active="buscar">
        <div className="body pad"><p className="helper">Cargando aviso…</p></div>
      </Screen>
    );
  }

  if (error || !listing) {
    return (
      <Screen active="buscar">
        <div className="body pad"><p className="helper">No pudimos cargar este aviso. ¿Está corriendo el backend?</p></div>
      </Screen>
    );
  }

  const gallery = listing.fotos?.length ? listing.fotos.map((f) => f.url) : [null];
  const mp = listing.market_position;
  const markerPct = mp?.diferencia_pct != null
    ? Math.max(4, Math.min(96, 50 + mp.diferencia_pct))
    : 50;
  const gmaps = listing.lat != null && listing.lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`
    : null;
  const direccionVisible = (listing.ocultar_direccion ? listing.zone?.nombre : listing.direccion) || listing.zone?.nombre;

  const guardado = favoritos.includes(listing.id);
  const onGuardar = () => {
    const agregado = toggleFavorite(listing.id);
    toast(agregado ? 'Agregado a guardados' : 'Quitado de guardados');
  };

  const goTo = (i) => {
    setActive(i);
    setThumbStart(s => {
      if (i < s) return i;
      if (i >= s + THUMBS_PER_PAGE) return i - THUMBS_PER_PAGE + 1;
      return s;
    });
  };
  const prev = () => goTo((active - 1 + gallery.length) % gallery.length);
  const next = () => goTo((active + 1) % gallery.length);

  return (
    <Screen active="buscar">
      <div className="body" style={{ flexDirection: 'column' }}>
        <div className="scroll-y" style={{ flex: 1 }}>
          <div className="pad" style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 30, paddingTop: 52, paddingBottom: 40, width: '100%' }}>

            {/* Columna izquierda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h1 className="h1">{listing.titulo}</h1>
                <span className="lbl" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
                  <Ic n="pin" size={15} /> {listing.zone?.nombre}
                </span>
              </div>
              <div style={{ position: 'relative', maxWidth: '86%' }}>
                <Photo src={gallery[active]} style={{ borderRadius: 'var(--r-lg)', aspectRatio: '4 / 3', height: 'auto' }} />
                {gallery.length > 1 && (
                  <>
                    <button className="btn btn--sm" onClick={prev} style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', width: 38, height: 38, padding: 0, borderRadius: '50%', boxShadow: 'var(--shadow)', zIndex: 3 }}>
                      <Ic n="left" size={18} />
                    </button>
                    <button className="btn btn--sm" onClick={next} style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', width: 38, height: 38, padding: 0, borderRadius: '50%', boxShadow: 'var(--shadow)', zIndex: 3 }}>
                      <Ic n="right" size={18} />
                    </button>
                    <span className="legend" style={{ bottom: 12, left: '50%', transform: 'translateX(-50%)' }}>{active + 1} / {gallery.length}</span>
                  </>
                )}
              </div>
              {gallery.length > 1 && (() => {
                const thumbW = `calc((100% - ${(THUMBS_PER_PAGE - 1) * 10}px) / ${THUMBS_PER_PAGE})`;
                return (
                  <div style={{ display: 'flex', gap: 10, width: '86%' }}>
                    {gallery.slice(thumbStart, thumbStart + THUMBS_PER_PAGE).map((src, idx) => {
                      const i = thumbStart + idx;
                      return (
                        <div key={i} onClick={() => goTo(i)} style={{ cursor: 'pointer', flex: `0 0 ${thumbW}`, minWidth: 0, borderRadius: 'var(--r-sm)', outline: active === i ? '2.5px solid var(--clay)' : '2.5px solid transparent', outlineOffset: 2, transition: 'outline-color .14s' }}>
                          <Photo h={57} src={src} style={{ width: '100%', borderRadius: 'var(--r-sm)', opacity: active === i ? 1 : .68, transition: 'opacity .14s' }} />
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              <div className="card card--pad">
                <h3 className="h3" style={{ marginBottom: 16 }}>Características</h3>
                <div className="datarow" style={{ fontSize: 14, gap: 22 }}>
                  <span className="d"><Ic n="bed"    size={16} /> {formatBeds(listing.dormitorios)}</span>
                  <span className="d"><Ic n="bath"   size={16} /> {listing.banos} baño{listing.banos === 1 ? '' : 's'}</span>
                  {listing.metraje_m2 ? <span className="d"><Ic n="ruler" size={16} /> {formatArea(listing.metraje_m2)}</span> : null}
                  {listing.piso != null && <span className="d"><Ic n="floors" size={16} /> Piso {listing.piso}</span>}
                  <span className="d"><Ic n="dollar" size={16} /> {listing.expensas_incluidas ? 'Expensas incluidas' : 'Expensas no incluidas'}</span>
                </div>
                {listing.amenities?.length > 0 && (
                  <>
                    <div className="divider" />
                    <div className="datarow" style={{ fontSize: 14, gap: 22 }}>
                      {listing.amenities.map(a => (
                        <span key={a.id} className="d"><Ic n={a.id} size={16} /> {a.nombre}</span>
                      ))}
                    </div>
                  </>
                )}
                <div className="divider" />
                <p style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                  {stripHtml(listing.descripcion)}
                </p>
              </div>
            </div>

            {/* Columna derecha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <span className="big-price">{formatPrice(listing.precio)}<span className="per"> /mes</span></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Btn variant="primary" block icon="phone" onClick={() => go('1D', { id: listing.id })}>Contactar al propietario</Btn>
                <Btn block icon="bookmark" variant={guardado ? 'saved' : undefined} onClick={onGuardar}>
                  {guardado ? 'Aviso guardado' : 'Guardar aviso'}
                </Btn>
              </div>

              <div className="card card--key card--pad">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 className="h3">Precio vs. mercado</h3>
                  <MarketChip level={marketLevel(mp)} />
                </div>
                {mp?.muestra_confiable ? (
                  <>
                    <MarketBar markerPct={markerPct} median={50} med={formatPrice(mp.precio_mediana)} />
                    <p style={{ fontSize: 14, marginTop: 16, marginBottom: 0, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                      Este precio está{' '}
                      <b style={{ color: mp.nivel === 'below' ? 'var(--below)' : mp.nivel === 'above' ? 'var(--above)' : 'var(--ink)' }}>
                        {mp.diferencia_pct != null
                          ? `${Math.abs(Math.round(mp.diferencia_pct))}% ${mp.diferencia_pct < 0 ? 'por debajo' : 'por encima'}`
                          : 'en línea'}
                      </b>{' '}
                      de la mediana para {formatBeds(listing.dormitorios).toLowerCase()} en {listing.zone?.nombre}.
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: 14, marginTop: 4, marginBottom: 0, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                    No hay suficientes avisos en esta zona para comparar con el mercado.
                  </p>
                )}
              </div>

              {/* Mapa: ubicación del aviso (fijo, no interactivo) */}
              {listing.lat != null && listing.lng != null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div style={{ aspectRatio: '3 / 2', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
                    <MapView
                      center={[listing.lat, listing.lng]}
                      zoom={16}
                      markers={[{ pos: [listing.lat, listing.lng], price: null }]}
                      style={{ height: '100%' }}
                      /* Ficha del aviso: el mapa solo ubica la propiedad, no se
                         explora desde acá. Para eso está el link a Google Maps. */
                      interactive={false}
                    />
                    {/* Link Google Maps */}
                    <a
                      href={gmaps}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        position: 'absolute', bottom: 10, right: 10, zIndex: 500,
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'var(--surface)', border: '1px solid var(--border-2)',
                        borderRadius: 'var(--r-sm)', padding: '6px 11px',
                        fontSize: 12.5, fontWeight: 500, color: 'var(--ink-2)',
                        textDecoration: 'none', boxShadow: 'var(--shadow-sm)',
                        transition: 'border-color .14s, color .14s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--clay-tint)'; e.currentTarget.style.color = 'var(--clay-deep)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.color = 'var(--ink-2)'; }}
                    >
                      <Ic n="pin" size={13} /> Ver en Google Maps
                    </a>
                  </div>
                  <p className="helper" style={{ margin: '8px 0 0', textAlign: 'right' }}>
                    {direccionVisible}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </Screen>
  );
}
