import { useCallback, useEffect, useRef, useState } from 'react';
import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { Photo } from '../../components/ui/Photo';
import { Btn } from '../../components/ui/Btn';
import { Ic } from '../../components/ui/Ic';
import { MarketChip } from '../../components/ui/MarketChip';
import { getListing } from '../../api/listings';
import { formatPrice, formatArea, marketLevel } from '../../lib/format';
import { useFavorites, dropFavorite } from '../../lib/favorites';

/** Columnas de aviso que entran en pantalla: con más de 3 la grilla se
 *  vuelve ilegible, así que el resto se alcanza con las flechas. */
const COLS_VISIBLES = 3;
/** Ancho de la columna de etiquetas, que queda fija al desplazar. */
const COL_ETIQUETAS = 170;

const ATTRS = [
  { label: 'vs. mercado',    cell: (p) => <MarketChip level={marketLevel(p.market_position)} /> },
  { label: 'Dormitorios',    cell: (p) => <span className="cmpval"><Ic n="bed"    size={15} /> {p.dormitorios}</span> },
  { label: 'Baños',          cell: (p) => <span className="cmpval"><Ic n="bath"   size={15} /> {p.banos}</span> },
  { label: 'Superficie',     cell: (p) => <span className="cmpval"><Ic n="ruler"  size={15} /> {formatArea(p.metraje_m2) || '—'}</span> },
  { label: 'Zona',           cell: (p) => <span className="cmpval"><Ic n="pin"    size={15} /> {p.zone?.nombre}</span> },
  { label: 'Piso',           cell: (p) => <span className="cmpval"><Ic n="floors" size={15} /> {p.piso ?? '—'}</span> },
  { label: 'Gastos comunes', cell: (p) => <span className="cmpval"><Ic n="dollar" size={15} /> {p.expensas_incluidas ? 'Incluidos' : (p.expensas_monto ? formatPrice(p.expensas_monto) : 'No incluidos')}</span> },
];

export function S1F() {
  const { go, toast } = useNav();
  const favoritos = useFavorites();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const gridRef = useRef(null);
  const [flechas, setFlechas] = useState({ prev: false, next: false });
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const clave = favoritos.join(',');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!favoritos.length) {
        setItems([]);
        setLoading(false);
        return;
      }
      // Si es una eliminación (no se agregó ningún id nuevo), ya tenemos los
      // datos en memoria: recortar la lista in place evita el parpadeo de un
      // refetch completo y el "Cargando…" que tapaba toda la grilla.
      const cached = itemsRef.current;
      const soloElimino = cached.length > 0 && favoritos.every((id) => cached.some((it) => it.id === id));
      if (soloElimino) {
        setItems(cached.filter((it) => favoritos.includes(it.id)));
        return;
      }
      setLoading(true);
      try {
        // Un favorito puede apuntar a un aviso dado de baja: se descarta en vez
        // de tumbar toda la comparación.
        const details = await Promise.all(favoritos.map((id) => getListing(id).catch(() => null)));
        if (!cancelled) { setItems(details.filter(Boolean)); setError(null); }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  const cheapest = items.length ? Math.min(...items.map((p) => p.precio)) : null;
  const paginado = items.length > COLS_VISIBLES;

  /** Las flechas se apagan en cada extremo del recorrido. */
  const syncFlechas = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setFlechas({ prev: el.scrollLeft > 2, next: el.scrollLeft < max - 2 });
  }, []);

  useEffect(() => {
    syncFlechas();
    window.addEventListener('resize', syncFlechas);
    return () => window.removeEventListener('resize', syncFlechas);
  }, [items.length, paginado, syncFlechas]);

  /** Avanza o retrocede una columna de aviso por click. */
  const desplazar = (dir) => {
    const el = gridRef.current;
    if (!el) return;
    const paso = Math.max(160, (el.clientWidth - COL_ETIQUETAS) / COLS_VISIBLES);
    el.scrollBy({ left: dir * paso, behavior: 'smooth' });
  };

  const quitar = (id) => {
    dropFavorite(id);
    toast('Quitado de guardados');
  };

  return (
    <Screen active="favoritos">
      <div className="body" style={{ flexDirection: 'column' }}>
        <div className="pad" style={{ paddingBottom: 14, display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--line)' }}>
          <a className="crumbs" onClick={() => go('1A')}><Ic n="left" size={15} /> Volver a buscar</a>
          <h2 className="h2" style={{ marginLeft: 4 }}>Mis guardados</h2>
          <div style={{ flex: 1 }} />
          <span className="tag-note">
            <Ic n="bookmark" size={13} />
            {favoritos.length} guardado{favoritos.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="scroll-y" style={{ flex: 1 }}>
          <div className="pad" style={{ paddingBottom: 40 }}>
            {loading && <p className="helper">Cargando…</p>}
            {error && <p className="helper">No pudimos cargar los avisos. ¿Está corriendo el backend?</p>}

            {!loading && !error && !items.length && (
              <div className="card card--pad" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
                <h3 className="h3">Todavía no guardaste ningún apartamento</h3>
                <p className="helper" style={{ marginTop: 8, marginBottom: 18 }}>
                  Guardá cualquier aviso desde el botón de su esquina y lo vas a encontrar acá, listo para comparar.
                </p>
                <Btn variant="primary" icon="search" onClick={() => go('1A')}>Buscar apartamentos</Btn>
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <>
                {paginado && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <p className="helper" style={{ margin: 0 }}>
                      Comparando {items.length} avisos — usá las flechas para ver los demás.
                    </p>
                    <div style={{ flex: 1 }} />
                    <button className="cmpnav" title="Ver anteriores" disabled={!flechas.prev} onClick={() => desplazar(-1)}>
                      <Ic n="left" size={16} />
                    </button>
                    <button className="cmpnav" title="Ver siguientes" disabled={!flechas.next} onClick={() => desplazar(1)}>
                      <Ic n="right" size={16} />
                    </button>
                  </div>
                )}
                <div
                  ref={gridRef}
                  className={'cmpgrid' + (paginado ? ' cmpgrid--scroll' : '')}
                  onScroll={paginado ? syncFlechas : undefined}
                  style={{
                    gridTemplateColumns: paginado
                      ? `${COL_ETIQUETAS}px repeat(${items.length}, calc((100% - ${COL_ETIQUETAS}px) / ${COLS_VISIBLES}))`
                      : `${COL_ETIQUETAS}px repeat(${items.length}, minmax(0, 1fr))`,
                  }}
                >
                  {/* Header row */}
                  <div className="cmpcorner" />
                  {items.map((p) => {
                    const best = p.precio === cheapest;
                    return (
                      <div className={'cmphead' + (best ? ' cmphead--best' : '')} key={p.id}>
                        <div className="cmphead-top">
                          {best ? <span className="cmpflag">★ Mejor precio</span> : <span />}
                          <button className="cmpclose" title="Quitar de guardados" onClick={() => quitar(p.id)}>
                            <Ic n="close" size={14} />
                          </button>
                        </div>
                        <Photo h={92} src={p.fotos?.[0]?.url} style={{ borderRadius: 'var(--r-sm)' }} />
                        <span className="big-price" style={{ fontSize: 26 }}>{formatPrice(p.precio)}<span className="per"> /mes</span></span>
                      </div>
                    );
                  })}

                  {/* Attribute rows */}
                  {ATTRS.map((a, r) => (
                    <div key={r} style={{ display: 'contents' }}>
                      <div className="cmplabel">{a.label}</div>
                      {items.map((p) => (
                        <div className={'cmpcell' + (p.precio === cheapest ? ' cmpcell--best' : '')} key={p.id}>{a.cell(p)}</div>
                      ))}
                    </div>
                  ))}

                  {/* Action row */}
                  <div className="cmplabel" />
                  {items.map((p) => (
                    <div className={'cmpcell cmpactions' + (p.precio === cheapest ? ' cmpcell--best' : '')} key={p.id}>
                      <Btn sm block onClick={() => go('1C', { id: p.id })}>Ver aviso</Btn>
                      <Btn sm block variant="primary" icon="phone" onClick={() => go('1D', { id: p.id })}>Contactar</Btn>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Screen>
  );
}
