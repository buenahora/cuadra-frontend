import { useState } from 'react';
import { useNav } from '../../context/NavContext';
import { WizardStep } from './WizardStep';
import { Field } from '../../components/ui/Field';
import { Check } from '../../components/ui/Controls';
import { MapBlock, Pin } from '../../components/ui/MapBlock';
import { Ic } from '../../components/ui/Ic';

const BARRIOS = [
  'Pocitos', 'Cordón', 'Parque Rodó', 'Punta Carretas', 'La Blanqueada',
  'Tres Cruces', 'Palermo', 'Buceo', 'Malvín', 'Carrasco', 'Centro',
  'Ciudad Vieja', 'Prado', 'Sayago', 'Cerro',
];

export function S2B() {
  const { go } = useNav();
  const [direccion, setDireccion]   = useState('Av. Brasil 2675');
  const [barrio, setBarrio]         = useState('Pocitos');
  const [entreCalles, setEntreCalles] = useState('');
  const [ocultarDir, setOcultarDir] = useState(false);

  return (
    <WizardStep step={1} onBack={() => go('2A')} onNext={() => go('2C')}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          <Field
            label="Dirección del apartamento"
            value={direccion}
            onChange={setDireccion}
            placeholder="Ej. Av. Brasil 2675"
            icon="pin"
          />

          {/* Barrio — select estilizado */}
          <div className="field-wrap">
            <span className="lbl">Barrio</span>
            <div className="field" style={{ cursor: 'pointer' }}>
              <Ic n="caretD" size={16} />
              <select
                value={barrio}
                onChange={e => setBarrio(e.target.value)}
                style={{
                  border: 'none', outline: 'none', background: 'transparent', flex: 1,
                  fontSize: 15, fontFamily: 'var(--sans)', color: 'var(--ink)',
                  cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
                }}
              >
                {BARRIOS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <Field
            label="Entre calles (referencia, opcional)"
            value={entreCalles}
            onChange={setEntreCalles}
            placeholder="Ej. entre Av. Libertad y Br. España"
          />

          <Check checked={ocultarDir} onChange={setOcultarDir}>
            No mostrar la dirección exacta en el aviso (mostrar solo el barrio)
          </Check>
        </div>

        <MapBlock style={{ height: 332 }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-100%)' }}>
            <Pin />
          </div>
          <span className="legend" style={{ bottom: 12, left: 12 }}>El mapa se actualiza al escribir</span>
        </MapBlock>
      </div>
    </WizardStep>
  );
}
