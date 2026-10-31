import { useState, useEffect, useMemo } from 'react';
import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { Btn } from '../../components/ui/Btn';
import { Seg } from '../../components/ui/Controls';
import { ZoneSelect } from '../../components/ui/ZoneSelect';
import { MarketBar } from '../../components/ui/MarketBar';
import { TrendChart } from '../../components/ui/TrendChart';
import { NeighborhoodBoxPlot } from '../../components/ui/NeighborhoodBoxPlot';
import { OfferHistogram } from '../../components/ui/OfferHistogram';
import { VsMontevideoChart } from '../../components/ui/VsMontevideoChart';
import { listZones } from '../../api/catalogs';
import { listMarketStats, listMarketSnapshots } from '../../api/market';
import { listListings } from '../../api/listings';
import { formatPrice, formatArea } from '../../lib/format';
import { median } from '../../lib/stats';

// Etiqueta visible -> dormitorios_bucket del contrato (schemas/common.py).
const BUCKETS = [
  { label: 'Mono', bucket: '0', tipologia: 'monoambientes' },
  { label: '1',    bucket: '1', tipologia: 'apartamentos de 1 dormitorio' },
  { label: '2',    bucket: '2', tipologia: 'apartamentos de 2 dormitorios' },
  { label: '3+',   bucket: '3+', tipologia: 'apartamentos de 3 o más dormitorios' },
];

// A qué bucket visible pertenece un aviso crudo (para agrupar del
// lado del cliente el dataset completo de Montevideo, ver montevideoListings).
function dormitoriosToBucket(n) {
  if (n == null) return null;
  return n >= 3 ? '3+' : String(n);
}

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const RANKING_MAX = 12;
const HIST_BINS = 12;
const LISTINGS_PAGE_SIZE = 100;
const LISTINGS_MAX_PAGES = 20; // salvaguarda: 2000 avisos, muy por encima del volumen real

// "2026-08-01" -> "Ago". Se parsea a mano: new Date(iso) interpreta UTC y en
// UY corre el mes un día para atrás.
function monthLabel(periodo) {
  const m = Number(String(periodo).split('-')[1]);
  return MESES[m - 1] ?? '';
}

function StatCard({ label, value, hint, highlight, small }) {
  return (
    <div style={{
      border: '1px solid ' + (highlight ? 'var(--clay-tint)' : 'var(--border)'),
      borderRadius: 'var(--r)', padding: '14px 18px',
      background: highlight ? 'var(--clay-wash)' : 'var(--surface-2)',
    }}>
      <div className="kicker">{label}</div>
      <div
        className="big-price"
        style={{
          fontSize: small ? 19 : 26, marginTop: 7, whiteSpace: 'nowrap',
          color: highlight ? 'var(--clay-deep)' : 'var(--ink)',
        }}
      >
        {value}
      </div>
      {hint && <div className="helper" style={{ marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// Fila liviana de ranking (nombre + barra + valor) -- se usa dos veces lado
// a lado (medianas / precio por m²), por eso no es la tabla grande .tbl--rank.
function RankRows({ rows, selectedZoneId, onSelect, format }) {
  if (!rows.length) return <p className="helper">Sin datos suficientes.</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <div className="ranklist">
      {rows.map((r) => (
        <div
          key={r.zone_id}
          className={'rankrow' + (r.zone_id === selectedZoneId ? ' on' : '')}
          onClick={() => onSelect(r.zone_id)}
          title={`Ver la ficha de ${r.barrio}`}
        >
          <span className="nm">{r.barrio}</span>
          <div className="track"><div className="fill" style={{ width: (r.value / max * 100) + '%' }} /></div>
          <span className="val">{format(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function S3D() {
  const { go, params } = useNav();
  const [zones, setZones]     = useState([]);
  const [zoneId, setZoneId]   = useState(params.zone_id || null);
  const [dorms, setDorms]     = useState(params.dorms || '1');
  const [stat, setStat]       = useState(null);
  const [serie, setSerie]     = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  // Todos los avisos activos de Montevideo (todas las zonas, todas las
  // tipologías), traídos una sola vez -- alimenta el histograma de oferta,
  // el ranking de precio/m² y los KPIs globales. Se filtra por bucket y
  // barrio del lado del cliente porque el volumen real es chico (unos
  // pocos cientos de avisos).
  const [montevideoListings, setMontevideoListings] = useState([]);
  // Fijo al montar -- evita llamar Date.now() durante el render en el
  // useMemo de "días en el mercado" (regla react-hooks/purity).
  const [now] = useState(() => Date.now());

  // Barrios con avisos: el catálogo trae toda Montevideo, pero un barrio sin
  // avisos no tiene nada que analizar.
  useEffect(() => {
    let cancelled = false;
    listZones()
      .then((zs) => {
        if (cancelled) return;
        const conAvisos = zs
          .filter((z) => z.cantidad_avisos > 0)
          .sort((a, b) => b.cantidad_avisos - a.cantidad_avisos || a.nombre.localeCompare(b.nombre));
        setZones(conAvisos);
        setZoneId((actual) =>
          actual && conAvisos.some((z) => z.id === actual) ? actual : conAvisos[0]?.id ?? null
        );
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      try {
        let page = 1, all = [], total = Infinity;
        while (all.length < total && page <= LISTINGS_MAX_PAGES) {
          const res = await listListings({ page, page_size: LISTINGS_PAGE_SIZE });
          if (cancelled) return;
          all = all.concat(res.items ?? []);
          total = res.total ?? all.length;
          page += 1;
        }
        if (!cancelled) setMontevideoListings(all);
      } catch {
        if (!cancelled) setMontevideoListings([]);
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, []);

  // Ficha del barrio elegido: estadística vigente + serie de 12 meses.
  useEffect(() => {
    if (!zoneId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [stats, snaps] = await Promise.all([
          listMarketStats({ zone_id: zoneId, dormitorios_bucket: dorms }),
          listMarketSnapshots({ zone_id: zoneId, dormitorios_bucket: dorms }).catch(() => []),
        ]);
        if (cancelled) return;
        setStat(stats[0] ?? null);
        setSerie(snaps.slice(-12));
        setError(false);
      } catch {
        if (cancelled) return;
        setError(true);
        setStat(null);
        setSerie([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [zoneId, dorms]);

  // Comparativa macro: la misma tipología en todos los barrios.
  useEffect(() => {
    let cancelled = false;
    listMarketStats({ dormitorios_bucket: dorms })
      .then((stats) => {
        if (cancelled) return;
        setRanking(
          stats
            .filter((s) => s.muestra_confiable && s.precio_mediana != null)
            .sort((a, b) => b.precio_mediana - a.precio_mediana)
        );
      })
      .catch(() => { if (!cancelled) setRanking([]); });
    return () => { cancelled = true; };
  }, [dorms]);

  const zone     = zones.find((z) => z.id === zoneId);
  const tipo     = BUCKETS.find((b) => b.bucket === dorms) ?? BUCKETS[1];
  const confiable = stat?.muestra_confiable && stat?.precio_mediana != null;

  const { pts, priceLabels, months } = useMemo(() => ({
    pts:         serie.map((s) => s.precio_mediana),
    priceLabels: serie.map((s) => formatPrice(s.precio_mediana)),
    months:      serie.map((s) => monthLabel(s.periodo)),
  }), [serie]);

  const medianPct = confiable && stat.precio_max > stat.precio_min
    ? Math.round((stat.precio_mediana - stat.precio_min) / (stat.precio_max - stat.precio_min) * 100)
    : 50;

  const yoy = stat?.variacion_interanual_pct;
  const posicion = ranking.findIndex((r) => r.zone_id === zoneId);

  // La tabla se recorta a los más caros (RANKING_MAX), pero el boxplot
  // muestra todos los barrios con muestra confiable -- con scroll horizontal.
  const topRanking = ranking.slice(0, RANKING_MAX);
  const boxplotData = ranking
    .filter((r) => r.precio_min != null && r.precio_max != null && r.precio_q1 != null && r.precio_q3 != null)
    .map((r) => ({
      zone_id: r.zone_id,
      barrio: r.barrio,
      min: r.precio_min,
      q1: r.precio_q1,
      median: r.precio_mediana,
      q3: r.precio_q3,
      max: r.precio_max,
      avisos: r.avisos_activos,
    }));

  // Avisos de la tipología elegida, en toda Montevideo -- base para el
  // histograma de oferta, el ranking de precio/m² y los KPIs globales.
  const bucketListings = useMemo(
    () => montevideoListings.filter((l) => dormitoriosToBucket(l.dormitorios) === dorms),
    [montevideoListings, dorms]
  );

  const zoneListings = useMemo(
    () => bucketListings.filter((l) => l.zone_id === zoneId),
    [bucketListings, zoneId]
  );

  const montevideoMedianPrecio = useMemo(
    () => median(bucketListings.map((l) => l.precio)),
    [bucketListings]
  );

  const yoyGlobal = useMemo(() => {
    const conDato = ranking.filter((r) => r.variacion_interanual_pct != null);
    const totalAvisos = conDato.reduce((a, r) => a + (r.avisos_activos ?? 0), 0);
    if (!totalAvisos) return null;
    return conDato.reduce((a, r) => a + r.variacion_interanual_pct * r.avisos_activos, 0) / totalAvisos;
  }, [ranking]);

  const brecha = useMemo(() => {
    if (ranking.length < 2) return null;
    const max = ranking[0], min = ranking[ranking.length - 1];
    return { ratio: max.precio_mediana / min.precio_mediana, maxBarrio: max.barrio, minBarrio: min.barrio };
  }, [ranking]);

  const precioM2Ranking = useMemo(() => {
    const porZona = new Map();
    bucketListings.forEach((l) => {
      if (!l.metraje_m2 || !l.precio) return;
      const arr = porZona.get(l.zone_id) ?? [];
      arr.push(l.precio / l.metraje_m2);
      porZona.set(l.zone_id, arr);
    });
    return ranking
      .map((r) => {
        const vals = porZona.get(r.zone_id);
        if (!vals || vals.length < 3) return null;
        return { zone_id: r.zone_id, barrio: r.barrio, value: median(vals) };
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value)
      .slice(0, RANKING_MAX);
  }, [bucketListings, ranking]);

  const zonePrecioM2 = useMemo(() => {
    const vals = zoneListings.filter((l) => l.metraje_m2).map((l) => l.precio / l.metraje_m2);
    return vals.length ? median(vals) : null;
  }, [zoneListings]);

  const zoneSuperficie = useMemo(() => {
    const vals = zoneListings.map((l) => l.metraje_m2).filter(Boolean);
    return vals.length ? median(vals) : null;
  }, [zoneListings]);

  const zoneDias = useMemo(() => {
    const vals = zoneListings
      .map((l) => l.creado_en ? Math.round((now - new Date(l.creado_en).getTime()) / 86400000) : null)
      .filter((v) => v != null && v >= 0);
    return vals.length ? Math.round(median(vals)) : null;
  }, [zoneListings, now]);

  const histogram = useMemo(() => {
    const prices = bucketListings.map((l) => l.precio).filter((p) => p != null);
    if (prices.length < 2) return null;
    const lo = Math.min(...prices), hi = Math.max(...prices);
    const span = (hi - lo) || 1;
    const bw = span / HIST_BINS;
    const bins = Array.from({ length: HIST_BINS }, (_, i) => ({ from: lo + bw * i, to: lo + bw * (i + 1), count: 0, selCount: 0 }));
    bucketListings.forEach((l) => {
      if (l.precio == null) return;
      let idx = Math.floor((l.precio - lo) / bw);
      if (idx >= HIST_BINS) idx = HIST_BINS - 1;
      if (idx < 0) idx = 0;
      bins[idx].count += 1;
      if (l.zone_id === zoneId) bins[idx].selCount += 1;
    });
    const total = prices.length;
    let running = 0;
    bins.forEach((b) => { running += b.count; b.cum = running / total; });
    return { bins, total };
  }, [bucketListings, zoneId]);

  const histNotes = useMemo(() => {
    if (!histogram) return null;
    const { bins, total } = histogram;
    const peak = bins.reduce((a, b) => (b.count > a.count ? b : a));
    const belowSelected = confiable
      ? bins.filter((b) => b.to <= stat.precio_mediana).reduce((a, b) => a + b.count, 0) / total
      : null;
    const belowGlobal = montevideoMedianPrecio != null
      ? bins.filter((b) => b.to <= montevideoMedianPrecio).reduce((a, b) => a + b.count, 0) / total
      : null;
    return { peak, belowSelected, belowGlobal };
  }, [histogram, confiable, stat, montevideoMedianPrecio]);

  return (
    <Screen active="analisis">
      <div className="body scroll-y">
        <div className="pad" style={{ maxWidth: 1080, margin: '0 auto', width: '100%', paddingBottom: 60 }}>

          <div className="kicker">Análisis de mercado</div>
          <h1 className="h1" style={{ marginTop: 8 }}>¿Cómo está el mercado en cada barrio?</h1>
          <p className="lbl" style={{ marginTop: 8 }}>
            Mediana, rango y evolución de los alquileres barrio por barrio. Sin cuenta, sin avisos de por medio.
          </p>

          {/* Selectores */}
          <div className="card card--pad" style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'minmax(220px, 380px) auto', gap: 18, alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div className="field-wrap">
              <span className="lbl">Barrio</span>
              <ZoneSelect zones={zones} value={zoneId} onChange={setZoneId} />
            </div>

            <div className="field-wrap">
              <span className="lbl">Dormitorios</span>
              <Seg
                options={BUCKETS.map((b) => b.label)}
                value={tipo.label}
                onChange={(label) => setDorms(BUCKETS.find((b) => b.label === label).bucket)}
              />
            </div>
          </div>

          {error && (
            <p className="helper" style={{ marginTop: 18 }}>
              No pudimos cargar los datos de mercado. ¿Está corriendo el backend?
            </p>
          )}

          {/* Sección 1: analítica genérica de Montevideo */}
          <div className="kicker" style={{ marginTop: 30 }}>Montevideo en general</div>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h2 className="h2">Montevideo, barrio por barrio</h2>
              <span className="helper">
                Mediana de {tipo.tipologia}, de mayor a menor · la barra compara contra el barrio más caro
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
              <StatCard
                label="Mediana Montevideo"
                value={montevideoMedianPrecio != null ? formatPrice(montevideoMedianPrecio) : '—'}
                hint={`${bucketListings.length} avisos de ${tipo.tipologia}`}
              />
              <StatCard
                label="Avisos activos"
                value={bucketListings.length}
                hint={`en ${ranking.length} barrio${ranking.length === 1 ? '' : 's'} con muestra confiable`}
              />
              <StatCard
                label="Variación interanual"
                value={yoyGlobal != null ? `${yoyGlobal >= 0 ? '+' : ''}${yoyGlobal.toFixed(1)}%` : '—'}
                hint="promedio ponderado"
              />
              <StatCard
                label="Brecha entre barrios"
                value={brecha ? `${brecha.ratio.toFixed(2)}×` : '—'}
                hint={brecha ? `${brecha.maxBarrio} vs. ${brecha.minBarrio}` : null}
              />
            </div>

            {ranking.length === 0
              ? <p className="helper">Sin barrios con muestra confiable para esta tipología.</p>
              : (
              <div className="card card--pad">
                <h3 className="h3">Rango de precios por barrio</h3>
                <p className="helper" style={{ marginTop: 4, marginBottom: 18 }}>
                  Caja = rango Q1-Q3 · línea = mediana · bigotes = mín-máx · {zone ? `${zone.nombre} en color` : 'el barrio elegido, en color'} · pasá el mouse por una caja para ver el detalle, clickeá para elegirla
                </p>
                <NeighborhoodBoxPlot data={boxplotData} selectedZoneId={zoneId} onSelect={setZoneId} />

                <div className="divider" />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }}>
                  <div>
                    <h3 className="h3" style={{ marginBottom: 4 }}>Ranking de medianas</h3>
                    <p className="helper" style={{ marginBottom: 10 }}>La barra compara contra el barrio más caro</p>
                    <RankRows
                      rows={topRanking.map((r) => ({ zone_id: r.zone_id, barrio: r.barrio, value: r.precio_mediana }))}
                      selectedZoneId={zoneId}
                      onSelect={setZoneId}
                      format={formatPrice}
                    />
                  </div>
                  <div>
                    <h3 className="h3" style={{ marginBottom: 4 }}>Precio por metro cuadrado</h3>
                    <p className="helper" style={{ marginBottom: 10 }}>Cuánto cuesta el m² en cada barrio, de mayor a menor</p>
                    <RankRows
                      rows={precioM2Ranking}
                      selectedZoneId={zoneId}
                      onSelect={setZoneId}
                      format={(v) => formatPrice(Math.round(v)) + '/m²'}
                    />
                  </div>
                </div>

                {ranking.length > RANKING_MAX && (
                  <p className="helper" style={{ marginTop: 12 }}>
                    Mostrando los {RANKING_MAX} barrios más caros de {ranking.length} con muestra confiable.
                  </p>
                )}

                <div className="divider" />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 4 }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <h3 className="h3" style={{ marginBottom: 4 }}>Cómo se reparte la oferta</h3>
                    <p className="helper">
                      {histogram
                        ? `Avisos activos de ${tipo.tipologia} por franja de precio, toda Montevideo · ${histogram.total} avisos en ${HIST_BINS} franjas`
                        : 'Sin datos suficientes para armar el histograma.'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', paddingTop: 4 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-soft)' }}>
                      <i style={{ width: 13, height: 13, borderRadius: 4, background: '#efe9dd', border: '1px solid var(--border)', flex: 'none' }} /> Resto de Montevideo
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-soft)' }}>
                      <i style={{ width: 13, height: 13, borderRadius: 4, background: 'var(--clay)', flex: 'none' }} /> <b style={{ color: 'var(--clay-deep)' }}>{zone?.nombre ?? '—'}</b>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-soft)' }}>
                      <i style={{ width: 16, height: 0, borderTop: '2px dashed var(--in)', flex: 'none' }} /> Oferta acumulada
                    </span>
                  </div>
                </div>

                {histogram && (
                  <>
                    <OfferHistogram
                      bins={histogram.bins}
                      montevideoMedian={montevideoMedianPrecio}
                      selectedMedian={confiable ? stat.precio_mediana : null}
                      selectedLabel={zone?.nombre}
                    />
                    {histNotes && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 22 }}>
                        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
                          <div className="kicker" style={{ marginBottom: 7 }}>Franja más poblada</div>
                          <div style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.45 }}>
                            <b>{formatPrice(histNotes.peak.from)}–{formatPrice(histNotes.peak.to)}</b> concentra el <b>{Math.round(histNotes.peak.count / histogram.total * 100)}%</b> de la oferta
                          </div>
                        </div>
                        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
                          <div className="kicker" style={{ marginBottom: 7 }}>Posición de {zone?.nombre ?? 'el barrio'}</div>
                          <div style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.45 }}>
                            {histNotes.belowSelected != null
                              ? <>Su mediana deja <b>{Math.round(histNotes.belowSelected * 100)}%</b> de la oferta por debajo</>
                              : 'Sin muestra confiable para este barrio.'}
                          </div>
                        </div>
                        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
                          <div className="kicker" style={{ marginBottom: 7 }}>Mitad más accesible</div>
                          <div style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.45 }}>
                            {histNotes.belowGlobal != null
                              ? <><b>{Math.round(histNotes.belowGlobal * 100)}%</b> de los avisos está bajo la mediana general</>
                              : '—'}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              )}
          </div>

          {/* Sección 2: analítica del barrio seleccionado */}
          <div className="kicker" style={{ marginTop: 34 }}>Barrio seleccionado</div>
          <div className="card card--pad" style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <h2 className="h2">{zone ? `${tipo.tipologia[0].toUpperCase()}${tipo.tipologia.slice(1)} en ${zone.nombre}` : 'Elegí un barrio'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {confiable && yoy != null && (
                  <span className={'status ' + (yoy >= 0 ? 'status--on' : 'status--off')}>
                    <span className="sd" />{yoy > 0 ? '+' : ''}{yoy}% interanual
                  </span>
                )}
                <Btn
                  variant="primary"
                  sm
                  icon="search"
                  disabled={!zone}
                  onClick={() => zone && go('1B', { zone_id: zone.id, zone_name: zone.nombre })}
                >
                  Ver avisos en {zone?.nombre ?? 'el barrio'}
                </Btn>
              </div>
            </div>

            {/* stat/serie quedan con los datos del barrio anterior mientras se
                pide el nuevo -- solo mostramos "Cargando" si todavía no hay
                nada que mostrar. Si no, atenuamos el contenido previo en vez
                de ocultarlo, para no generar un parpadeo al cambiar de barrio. */}
            {loading && stat == null && <p className="helper" style={{ marginTop: 16 }}>Cargando…</p>}

            {!confiable && !(loading && stat == null) && (
              <p className="helper" style={{ marginTop: 16 }}>
                Todavía no hay muestra suficiente de {tipo.tipologia} en {zone?.nombre ?? 'este barrio'}
                {stat ? ` (${stat.avisos_activos} aviso${stat.avisos_activos === 1 ? '' : 's'} activo${stat.avisos_activos === 1 ? '' : 's'})` : ''}.
                Probá con otra tipología o con un barrio de más volumen — preferimos no mostrar una mediana que no se sostiene.
              </p>
            )}

            {confiable && (
              <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity .15s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, margin: '20px 0' }}>
                  <StatCard label="Mediana" value={formatPrice(stat.precio_mediana)} highlight />
                  <StatCard label="Rango" value={`${formatPrice(stat.precio_min)} – ${formatPrice(stat.precio_max)}`} small />
                  <StatCard label="Avisos activos" value={stat.avisos_activos} />
                  <StatCard
                    label="Posición en Montevideo"
                    value={posicion >= 0 ? `#${posicion + 1}` : '—'}
                    hint={posicion >= 0 ? `de ${ranking.length} barrios con datos` : null}
                  />
                </div>

                <MarketBar
                  markerPct={medianPct}
                  median={medianPct}
                  min={formatPrice(stat.precio_min)}
                  med={formatPrice(stat.precio_mediana)}
                  max={formatPrice(stat.precio_max)}
                />

                <div className="divider" />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }}>
                  <div>
                    <h3 className="h3" style={{ marginBottom: 4 }}>Evolución de la mediana{pts.length > 1 ? ` · últimos ${pts.length} meses` : ''}</h3>
                    {pts.length > 1 ? (
                      <div style={{ marginTop: 10 }}>
                        <TrendChart pts={pts} priceLabels={priceLabels} months={months} />
                      </div>
                    ) : (
                      <p className="helper" style={{ marginTop: 10 }}>
                        Todavía no hay histórico mensual para {tipo.tipologia} en {zone?.nombre ?? 'este barrio'} — solo tenemos el dato de este mes.
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="h3" style={{ marginBottom: 4 }}>Contra el resto de Montevideo</h3>
                    <p className="helper" style={{ marginBottom: 10 }}>Dónde cae este barrio respecto a la mediana general</p>
                    <VsMontevideoChart
                      zones={ranking.map((r) => ({ zone_id: r.zone_id, barrio: r.barrio, precio_mediana: r.precio_mediana }))}
                      selectedZoneId={zoneId}
                      montevideoMedian={montevideoMedianPrecio}
                      onSelect={setZoneId}
                    />
                    <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginTop: 18 }}>
                      <div>
                        <div className="kicker" style={{ marginBottom: 5 }}>Precio por m²</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{zonePrecioM2 != null ? formatPrice(Math.round(zonePrecioM2)) + '/m²' : '—'}</div>
                      </div>
                      <div>
                        <div className="kicker" style={{ marginBottom: 5 }}>Superficie típica</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{zoneSuperficie != null ? `${formatArea(Math.round(zoneSuperficie))} típicos` : '—'}</div>
                      </div>
                      <div>
                        <div className="kicker" style={{ marginBottom: 5 }}>Días en el mercado</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{zoneDias != null ? `${zoneDias} días promedio` : '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </Screen>
  );
}
