import { useState } from 'react';
import { useNav } from '../../context/NavContext';
import { WizardStep } from './WizardStep';
import { Seg, Check } from '../../components/ui/Controls';
import { Ic } from '../../components/ui/Ic';

function Stepper({ val, onChange, min = 0, max = 10 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button className="btn btn--sm" style={{ width: 34, height: 34, padding: 0, borderRadius: 8 }}
        onClick={() => onChange(Math.max(min, val - 1))}>
        <Ic n="minus" size={16} />
      </button>
      <span className="price" style={{ fontSize: 20, minWidth: 22, textAlign: 'center' }}>{val}</span>
      <button className="btn btn--sm" style={{ width: 34, height: 34, padding: 0, borderRadius: 8 }}
        onClick={() => onChange(Math.min(max, val + 1))}>
        <Ic n="plus" size={16} />
      </button>
    </div>
  );
}

const INIT_AMENITIES = {
  'Cochera / Garaje': true, 'Balcón / Terraza': true, 'Ascensor': true,
  'Aire acondicionado': true, 'Placares empotrados': true, 'Parrillero': false,
  'Piscina': false, 'Gimnasio': false, 'Portería 24 hs': false,
  'Calefacción': false, 'Lavadero': false, 'Seguridad / Cámaras': false,
};

export function S2C() {
  const { go } = useNav();
  const [beds, setBeds]         = useState(1);
  const [baths, setBaths]       = useState(1);
  const [metraje, setMetraje]   = useState('44');
  const [piso, setPiso]         = useState('4');
  const [planta, setPlanta]     = useState(false);
  const [amueblado, setAmueblado] = useState('No');
  const [mascotas, setMascotas] = useState('Sí');
  const [amenities, setAmenities] = useState(INIT_AMENITIES);
  const [expensas, setExpensas] = useState('No');
  const [expMonto, setExpMonto] = useState('3.500');

  const toggleAmenity = (name) =>
    setAmenities(prev => ({ ...prev, [name]: !prev[name] }));

  return (
    <WizardStep step={2} onBack={() => go('2B')} onNext={() => go('2D')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        <div className="card card--pad">
          <h3 className="h3" style={{ marginBottom: 16 }}>Distribución</h3>
          <div style={{ display: 'flex', gap: 44, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field-wrap">
              <span className="lbl">Dormitorios</span>
              <Stepper val={beds} onChange={setBeds} min={0} max={8} />
            </div>
            <div className="field-wrap">
              <span className="lbl">Baños</span>
              <Stepper val={baths} onChange={setBaths} min={1} max={6} />
            </div>
            <div className="field-wrap" style={{ width: 120 }}>
              <span className="lbl">Metraje (m²)</span>
              <div className="field">
                <input
                  value={metraje}
                  onChange={e => setMetraje(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 15, fontFamily: 'var(--sans)', color: 'var(--ink)', width: '100%' }}
                />
              </div>
            </div>
            <div className="field-wrap" style={{ width: 100 }}>
              <span className="lbl">Piso</span>
              <div className="field">
                <input
                  value={piso}
                  onChange={e => setPiso(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 15, fontFamily: 'var(--sans)', color: 'var(--ink)', width: '100%' }}
                />
              </div>
            </div>
            <div style={{ paddingBottom: 11 }}>
              <Check checked={planta} onChange={setPlanta}>Es planta baja</Check>
            </div>
          </div>
        </div>

        <div className="card card--pad">
          <h3 className="h3" style={{ marginBottom: 16 }}>Comodidades</h3>
          <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
            <div className="field-wrap">
              <span className="lbl">Amueblado</span>
              <Seg options={['Sí', 'No', 'Parcial']} value={amueblado} onChange={setAmueblado} />
            </div>
            <div className="field-wrap">
              <span className="lbl">Permite mascotas</span>
              <Seg options={['Sí', 'No']} value={mascotas} onChange={setMascotas} />
            </div>
          </div>
          <div className="divider" />
          <span className="lbl" style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>Servicios y amenities</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))', gap: '13px 24px', marginTop: 12 }}>
            {Object.entries(amenities).map(([name, on]) => (
              <Check key={name} checked={on} onChange={() => toggleAmenity(name)}>{name}</Check>
            ))}
          </div>
        </div>

        <div className="card card--pad">
          <h3 className="h3" style={{ marginBottom: 16 }}>Costos</h3>
          <div style={{ display: 'flex', gap: 44, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field-wrap">
              <span className="lbl">¿Expensas incluidas en el precio?</span>
              <Seg options={['Sí', 'No']} value={expensas} onChange={setExpensas} />
            </div>
            {expensas === 'No' && (
              <div className="field-wrap" style={{ width: 160 }}>
                <span className="lbl">Monto de expensas</span>
                <div className="field">
                  <span style={{ color: 'var(--ink-2)', marginRight: 2 }}>$</span>
                  <input
                    value={expMonto}
                    onChange={e => setExpMonto(e.target.value.replace(/[^\d.]/g, ''))}
                    inputMode="decimal"
                    style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 15, fontFamily: 'var(--sans)', color: 'var(--ink)', width: '100%' }}
                  />
                </div>
              </div>
            )}
          </div>
          <p className="helper" style={{ marginTop: 12 }}>El monto solo se pide si las expensas no están incluidas.</p>
        </div>

      </div>
    </WizardStep>
  );
}
