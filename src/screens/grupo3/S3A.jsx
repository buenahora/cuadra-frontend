import { useState } from 'react';
import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { MapBlock } from '../../components/ui/MapBlock';
import { TrendChart } from '../../components/ui/TrendChart';
import { Btn } from '../../components/ui/Btn';
import { Seg } from '../../components/ui/Controls';

const MARKET = {
  '1 dorm': {
    stats: [['Mediana','$22.000'],['Rango','$16k – $30k'],['Avisos activos','38'],['vs. mes anterior','+2,1%']],
    pts:    [48, 51, 50, 54, 53, 57, 55, 60, 58, 62, 61, 65],
    prices: ['$18.500','$19.000','$18.800','$19.500','$19.200','$20.000','$19.800','$20.500','$20.200','$21.000','$20.800','$22.000'],
    table:  [['$16.500','38 m²','$434'],['$19.000','42 m²','$452'],['$21.500','45 m²','$478'],['$24.000','50 m²','$480'],['$28.000','58 m²','$483']],
  },
  '2 dorm': {
    stats: [['Mediana','$32.000'],['Rango','$22k – $45k'],['Avisos activos','24'],['vs. mes anterior','+1,8%']],
    pts:    [52, 55, 53, 58, 56, 61, 59, 64, 62, 66, 65, 69],
    prices: ['$27.000','$27.500','$27.200','$28.000','$27.800','$29.000','$28.500','$30.000','$29.500','$31.000','$30.500','$32.000'],
    table:  [['$22.000','60 m²','$367'],['$27.000','72 m²','$375'],['$31.500','85 m²','$371'],['$37.000','92 m²','$402'],['$44.000','105 m²','$419']],
  },
  '3+': {
    stats: [['Mediana','$48.000'],['Rango','$35k – $65k'],['Avisos activos','12'],['vs. mes anterior','+1,2%']],
    pts:    [56, 58, 57, 61, 60, 63, 62, 66, 65, 68, 67, 70],
    prices: ['$41.000','$42.000','$41.500','$43.000','$42.500','$44.000','$43.500','$45.000','$44.500','$46.000','$45.500','$48.000'],
    table:  [['$35.000','90 m²','$389'],['$40.000','105 m²','$381'],['$47.000','120 m²','$392'],['$55.000','140 m²','$393'],['$64.000','160 m²','$400']],
  },
};

const METRAJES = ['Todos', '< 40 m²', '40–60 m²', '60–80 m²', '> 80 m²'];
const FECHAS   = ['Últimos 3 meses', 'Últimos 6 meses', 'Últimos 12 meses', 'Último año'];

export function S3A() {
  const { go } = useNav();
  const [dorm,    setDorm]    = useState('1 dorm');
  const [metraje, setMetraje] = useState('Todos');
  const [fecha,   setFecha]   = useState('Últimos 12 meses');

  const d = MARKET[dorm];

  return (
    <Screen active="analisis">
      <div className="body" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Panel izquierdo: mapa */}
        <div style={{ flex: '1 1 60%', padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <Btn sm icon="draw">Dibujar zona</Btn>
            <Btn sm variant="ghost" iconR="caretD">Elegir barrio</Btn>
          </div>
          <MapBlock style={{ flex: 1 }}>
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <polygon points="140,80 420,70 520,240 410,380 170,350 90,210"
                fill="rgba(189,93,58,.13)" stroke="#bd5d3a" strokeWidth="2.5" strokeDasharray="7 5" />
              {[[140,80],[420,70],[520,240],[410,380],[170,350],[90,210]].map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r="5" fill="#fff" stroke="#bd5d3a" strokeWidth="2.5" />
              ))}
            </svg>
            <span className="legend" style={{ top: 14, left: 14 }}>Pocitos — zona seleccionada</span>
          </MapBlock>
        </div>

        {/* Panel derecho: datos */}
        <div style={{ flex: '1 1 40%', borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="scroll-y pad" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Seg options={['1 dorm','2 dorm','3+']} value={dorm} onChange={setDorm} />

              <div style={{ position: 'relative' }}>
                <select
                  value={metraje}
                  onChange={e => setMetraje(e.target.value)}
                  style={{ appearance: 'none', WebkitAppearance: 'none', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '6px 28px 6px 10px', fontSize: 13, fontFamily: 'var(--sans)', color: 'var(--ink)', background: 'var(--surface)', cursor: 'pointer' }}
                >
                  {METRAJES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: 'var(--ink-soft)' }}>▾</span>
              </div>

              <div style={{ position: 'relative' }}>
                <select
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  style={{ appearance: 'none', WebkitAppearance: 'none', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '6px 28px 6px 10px', fontSize: 13, fontFamily: 'var(--sans)', color: 'var(--ink)', background: 'var(--surface)', cursor: 'pointer' }}
                >
                  {FECHAS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: 'var(--ink-soft)' }}>▾</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {d.stats.map(([k, v]) => (
                <div key={k} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 16px', background: 'var(--surface-2)' }}>
                  <div className="kicker">{k}</div>
                  <div className="big-price" style={{ fontSize: 26, marginTop: 7 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Trend chart con tooltip */}
            <div className="card card--pad" style={{ padding: 18 }}>
              <h3 className="h3" style={{ marginBottom: 8 }}>Evolución de la mediana · 12 meses</h3>
              <TrendChart h={130} pts={d.pts} priceLabels={d.prices} />
            </div>

            {/* Tabla */}
            <div>
              <h3 className="h3" style={{ marginBottom: 10 }}>5 avisos más relevantes</h3>
              <div className="tbl">
                <div className="thead" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <span>Precio</span><span>Metraje</span><span>Precio/m²</span>
                </div>
                {d.table.map((r, i) => (
                  <div key={i} className="trow" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <span className="price">{r[0]}</span>
                    <span style={{ color: 'var(--ink-soft)' }}>{r[1]}</span>
                    <span className="price">{r[2]}</span>
                  </div>
                ))}
              </div>
            </div>

            <Btn variant="primary" block icon="download" onClick={() => go('3C')}>Exportar informe PDF</Btn>
          </div>
        </div>

      </div>
    </Screen>
  );
}
