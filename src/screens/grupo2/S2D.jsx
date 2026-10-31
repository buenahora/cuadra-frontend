import { useState } from 'react';
import { useNav } from '../../context/NavContext';
import { WizardStep } from './WizardStep';
import { Toggle, Check, Tip } from '../../components/ui/Controls';
import { MarketChip } from '../../components/ui/MarketChip';
import { MarketBar } from '../../components/ui/MarketBar';
import { Ic } from '../../components/ui/Ic';

const MIN = 16000;
const MED = 22000;
const MAX = 30000;
const SPAN = MAX - MIN;
const MED_PCT = Math.round((MED - MIN) / SPAN * 100);

const GARANTIA_INIT = {
  'ANDA': true,
  'Porto Seguro': true,
  'Garantía de Contaduría (BHU)': true,
  'Garantía propietaria': false,
  'Depósito en efectivo': false,
};

const INFO = {
  below: 'Un precio bajo puede atraer más consultas, pero puede generar desconfianza sobre la calidad.',
  in:    'Un precio dentro del rango de mercado recibe 3 veces más consultas.',
  above: 'Un precio por encima del mercado puede reducir significativamente las consultas recibidas.',
};

export function S2D() {
  const { go } = useNav();
  const [precio, setPrecio]       = useState(21000);
  const [negociable, setNegociable] = useState(true);
  const [garantias, setGarantias] = useState(GARANTIA_INIT);

  const toggleGarantia = (name) =>
    setGarantias(prev => ({ ...prev, [name]: !prev[name] }));

  const level = precio < MED * 0.92 ? 'below' : precio > MED * 1.08 ? 'above' : 'in';
  const markerPct = Math.max(0, Math.min(100, Math.round((precio - MIN) / SPAN * 100)));
  const diffPct   = Math.round(Math.abs(precio - MED) / MED * 100);

  const feedbackText = level === 'below'
    ? <>Tu precio está un <b style={{ color: 'var(--below)' }}>{diffPct}% por debajo</b> de la mediana.</>
    : level === 'above'
    ? <>Tu precio está un <b style={{ color: 'var(--above)' }}>{diffPct}% por encima</b> de la mediana.</>
    : <>Tu precio cae <b style={{ color: 'var(--in)' }}>dentro del rango</b> de mercado.</>;

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '');
    setPrecio(raw ? Math.min(Number(raw), 999999) : 0);
  };

  const displayPrice = precio === 0 ? '' : precio.toLocaleString('es-UY');

  return (
    <WizardStep step={3} onBack={() => go('2C')} onNext={() => go('2E')}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        <div>
          <span className="lbl" style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>Precio mensual</span>
          <div className="field field--big" style={{ marginTop: 7 }}>
            <Ic n="dollar" size={20} />
            <input
              type="text"
              inputMode="numeric"
              value={displayPrice}
              onChange={handlePriceChange}
              placeholder="0"
              style={{
                border: 'none', outline: 'none', background: 'transparent', flex: 1,
                fontSize: 'inherit', fontFamily: 'inherit', fontWeight: 'inherit',
                color: 'var(--ink)', width: '100%',
              }}
            />
          </div>
          <label className="chk" style={{ marginTop: 20, cursor: 'pointer' }}>
            <Toggle on={negociable} onChange={setNegociable} /> Precio negociable
          </label>
          <div className="divider" />
          <span className="lbl" style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>Garantías que aceptás</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {Object.entries(garantias).map(([name, on]) => (
              <Check key={name} checked={on} onChange={() => toggleGarantia(name)}>{name}</Check>
            ))}
          </div>
        </div>

        <div className="card card--key card--pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 className="h3">Referencia de mercado <Tip text="Calculado con avisos activos de 1 dorm en Pocitos." /></h3>
            <MarketChip level={level} />
          </div>
          <div className="lbl" style={{ marginBottom: 14 }}>
            1 dorm · Pocitos · mediana <b style={{ color: 'var(--ink)' }}>$22.000</b>
          </div>
          <MarketBar markerPct={markerPct} median={MED_PCT} min="$16.000" med="$22.000" max="$30.000" />
          <p className="helper" style={{ marginTop: 14 }}>{feedbackText}</p>
        </div>

      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--clay-wash)', border: '1px solid var(--clay-tint)', borderRadius: 'var(--r)', padding: '14px 18px', marginTop: 22, fontSize: 14, color: 'var(--ink-2)' }}>
        <Ic n="info" size={18} style={{ color: 'var(--clay-deep)', flex: 'none' }} />
        <span>{INFO[level]}</span>
      </div>
    </WizardStep>
  );
}
