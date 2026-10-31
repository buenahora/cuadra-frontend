import { useState } from 'react';
import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { Btn } from '../../components/ui/Btn';
import { Seg } from '../../components/ui/Controls';
import { MarketBar } from '../../components/ui/MarketBar';
import { TrendChart } from '../../components/ui/TrendChart';
import { Ic } from '../../components/ui/Ic';

const ZONAS = ['Pocitos', 'Cordón', 'Parque Rodó', 'Punta Carretas', 'La Blanqueada', 'Tres Cruces'];

const MARKET = {
  'Pocitos': {
    '1':  { min: 16000, med: 22000, max: 30000, avisos: 38, yoy: '+9%',  trend: [48, 51, 50, 54, 53, 57, 55, 60, 58, 62, 61, 65] },
    '2':  { min: 22000, med: 32000, max: 45000, avisos: 24, yoy: '+7%',  trend: [52, 55, 53, 58, 56, 61, 59, 64, 62, 66, 65, 69] },
    '3+': { min: 35000, med: 48000, max: 65000, avisos: 12, yoy: '+5%',  trend: [56, 58, 57, 61, 60, 63, 62, 66, 65, 68, 67, 70] },
  },
  'Cordón': {
    '1':  { min: 13000, med: 18000, max: 25000, avisos: 52, yoy: '+11%', trend: [42, 46, 44, 49, 48, 53, 51, 57, 55, 60, 58, 64] },
    '2':  { min: 18000, med: 26000, max: 38000, avisos: 31, yoy: '+8%',  trend: [46, 49, 47, 52, 51, 56, 54, 59, 57, 62, 61, 65] },
    '3+': { min: 28000, med: 38000, max: 52000, avisos: 9,  yoy: '+6%',  trend: [50, 52, 51, 55, 54, 58, 57, 61, 60, 64, 63, 67] },
  },
  'Parque Rodó': {
    '1':  { min: 14000, med: 19500, max: 27000, avisos: 29, yoy: '+10%', trend: [44, 47, 46, 50, 49, 54, 52, 57, 55, 60, 58, 63] },
    '2':  { min: 19000, med: 28000, max: 40000, avisos: 18, yoy: '+8%',  trend: [48, 50, 49, 53, 52, 57, 55, 60, 58, 62, 61, 65] },
    '3+': { min: 30000, med: 42000, max: 58000, avisos: 7,  yoy: '+5%',  trend: [52, 54, 53, 57, 56, 60, 59, 63, 62, 65, 64, 68] },
  },
  'Punta Carretas': {
    '1':  { min: 18000, med: 24000, max: 34000, avisos: 21, yoy: '+8%',  trend: [50, 53, 51, 55, 54, 58, 56, 60, 59, 62, 61, 65] },
    '2':  { min: 26000, med: 36000, max: 50000, avisos: 15, yoy: '+7%',  trend: [54, 56, 55, 59, 58, 62, 61, 65, 63, 67, 66, 70] },
    '3+': { min: 38000, med: 54000, max: 75000, avisos: 6,  yoy: '+4%',  trend: [58, 60, 59, 63, 62, 65, 64, 67, 66, 69, 68, 71] },
  },
  'La Blanqueada': {
    '1':  { min: 12000, med: 16500, max: 23000, avisos: 34, yoy: '+12%', trend: [38, 42, 40, 46, 44, 50, 48, 55, 52, 58, 55, 62] },
    '2':  { min: 17000, med: 24000, max: 34000, avisos: 22, yoy: '+9%',  trend: [44, 47, 45, 50, 48, 54, 52, 57, 55, 60, 58, 63] },
    '3+': { min: 26000, med: 36000, max: 50000, avisos: 8,  yoy: '+7%',  trend: [48, 51, 49, 54, 52, 57, 55, 60, 58, 62, 60, 65] },
  },
  'Tres Cruces': {
    '1':  { min: 11000, med: 15500, max: 22000, avisos: 41, yoy: '+13%', trend: [36, 40, 38, 44, 42, 49, 46, 53, 50, 57, 54, 61] },
    '2':  { min: 16000, med: 22500, max: 32000, avisos: 26, yoy: '+10%', trend: [40, 44, 42, 47, 45, 51, 49, 55, 53, 58, 56, 62] },
    '3+': { min: 24000, med: 34000, max: 47000, avisos: 10, yoy: '+8%',  trend: [46, 49, 47, 52, 50, 56, 54, 60, 57, 62, 60, 65] },
  },
};

const METRAJES = ['< 40 m²', '40 – 60 m²', '60 – 80 m²', '> 80 m²'];

const fmt = (n) => '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function S2A() {
  const { go } = useNav();
  const [zona, setZona]     = useState('Pocitos');
  const [dorms, setDorms]   = useState('1');
  const [metraje, setMetraje] = useState('40 – 60 m²');

  const d = MARKET[zona][dorms];
  const span = d.max - d.min;
  const medPct = Math.round((d.med - d.min) / span * 100);

  const dormLabel = dorms === '1' ? '1 dormitorio' : dorms === '2' ? '2 dormitorios' : '3 o más dormitorios';

  return (
    <Screen active="publicar">
      <div className="body scroll-y">
        <div className="pad" style={{ maxWidth: 900, margin: '0 auto', width: '100%', paddingBottom: 60 }}>
          <h1 className="h1">¿Cuánto se alquila en tu zona?</h1>
          <p className="lbl" style={{ marginTop: 8 }}>Conocé el precio de mercado antes de publicar.</p>

          <div className="card card--pad" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1.3fr 1fr 1.2fr auto', gap: 18, alignItems: 'flex-end' }}>

            {/* Zone selector */}
            <div className="field-wrap">
              <span className="lbl">Zona / Barrio</span>
              <div className="field" style={{ cursor: 'pointer' }}>
                <Ic n="pin" size={16} />
                <select
                  value={zona}
                  onChange={e => setZona(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 15, fontFamily: 'var(--sans)', color: 'var(--ink)', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
                >
                  {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
                <Ic n="caretD" size={16} />
              </div>
            </div>

            {/* Bedrooms Seg */}
            <div className="field-wrap">
              <span className="lbl">Dormitorios</span>
              <Seg options={['1', '2', '3+']} value={dorms} onChange={setDorms} />
            </div>

            {/* Metraje selector */}
            <div className="field-wrap">
              <span className="lbl">Metraje aprox.</span>
              <div className="field" style={{ cursor: 'pointer' }}>
                <select
                  value={metraje}
                  onChange={e => setMetraje(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 15, fontFamily: 'var(--sans)', color: 'var(--ink)', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
                >
                  {METRAJES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <Ic n="caretD" size={16} />
              </div>
            </div>

            <Btn variant="primary" icon="search" onClick={() => {}}>Ver precio</Btn>
          </div>

          <div className="card card--pad" style={{ marginTop: 26 }}>
            <h2 className="h2">Apartamentos de {dormLabel} en {zona}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, margin: '20px 0' }}>
              {[['Mínimo', d.min, false], ['Mediana', d.med, true], ['Máximo', d.max, false]].map(([k, v, hi]) => (
                <div key={k} style={{ border: '1px solid ' + (hi ? 'var(--clay-tint)' : 'var(--border)'), borderRadius: 'var(--r)', padding: '16px 18px', background: hi ? 'var(--clay-wash)' : 'var(--surface-2)' }}>
                  <div className="kicker">{k}</div>
                  <div className="big-price" style={{ fontSize: 30, marginTop: 8, color: hi ? 'var(--clay-deep)' : 'var(--ink)' }}>{fmt(v)}</div>
                </div>
              ))}
            </div>
            <MarketBar markerPct={medPct} median={medPct} min={fmt(d.min)} med={fmt(d.med)} max={fmt(d.max)} />
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="h3">Evolución últimos 12 meses</h3>
              <span className="status status--on"><span className="sd" />{d.yoy} interanual</span>
            </div>
            <div style={{ marginTop: 10 }}><TrendChart pts={d.trend} /></div>
            <p className="helper" style={{ marginTop: 6 }}>Basado en {d.avisos} avisos activos en esta zona.</p>
            <div style={{ marginTop: 18 }}>
              <Btn variant="primary" icon="plus" onClick={() => go('2B')}>Publicar mi apartamento con este precio</Btn>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}
