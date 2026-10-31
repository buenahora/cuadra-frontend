import { useState } from 'react';
import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { MapBlock } from '../../components/ui/MapBlock';
import { Lines } from '../../components/ui/Lines';
import { Field } from '../../components/ui/Field';
import { Btn } from '../../components/ui/Btn';
import { Seg, Check } from '../../components/ui/Controls';
import { Ic } from '../../components/ui/Ic';
import { Mark } from '../../components/ui/Mark';

const CHECKS_INIT = {
  'Precio mediano':       true,
  'Rango de precios':     true,
  'Evolución histórica':  true,
  'Avisos comparables':   true,
};

export function S3C() {
  const { go, toast } = useNav();

  const [titulo,    setTitulo]    = useState('Valuación Pocitos · 1 dorm');
  const [destinatario, setDestinatario] = useState('Carmen Suárez');
  const [periodo,   setPeriodo]   = useState('12 meses');
  const [checks,    setChecks]    = useState(CHECKS_INIT);

  const toggleCheck = (k) => setChecks(prev => ({ ...prev, [k]: !prev[k] }));

  return (
    <Screen active="analisis">
      <div className="body" style={{ position: 'relative', minHeight: 'calc(100vh - 64px)' }}>
        {/* blurred background */}
        <div style={{ position: 'absolute', inset: 0, opacity: .4, pointerEvents: 'none', display: 'flex' }}>
          <div className="map" style={{ flex: '1 1 60%', borderRadius: 0, borderRight: '1px solid var(--border)' }}>
            <MapBlock style={{ height: '100%', borderRadius: 0 }} />
          </div>
          <div style={{ flex: '1 1 40%', background: 'var(--surface)', padding: 26 }}>
            <Lines rows={6} />
          </div>
        </div>
        {/* scrim */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(33,31,28,.28)', backdropFilter: 'blur(1.5px)' }} />
        {/* modal */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="modal" style={{ maxWidth: 700, width: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 26 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h2 className="h2">Generar informe de mercado</h2>
                <button className="btn btn--ghost" style={{ width: 34, height: 34, padding: 0, borderRadius: '50%' }} onClick={() => go('3A')}>
                  <Ic n="close" size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Título del informe" value={titulo} onChange={setTitulo} />
                <Field label="Propietario destinatario" value={destinatario} onChange={setDestinatario} />
                <div className="field-wrap">
                  <span className="lbl">Período de datos</span>
                  <Seg options={['3 meses','6 meses','12 meses']} value={periodo} onChange={setPeriodo} />
                </div>
                <div className="field-wrap">
                  <span className="lbl">Incluir en el informe</span>
                  {Object.entries(checks).map(([k, v]) => (
                    <Check key={k} checked={v} onChange={() => toggleCheck(k)}>{k}</Check>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
                <Btn variant="ghost" onClick={() => go('3A')}>Cancelar</Btn>
                <div style={{ flex: 1 }} />
                <Btn variant="primary" icon="download" onClick={() => toast('Generando PDF…')}>Generar y descargar</Btn>
              </div>
            </div>

            {/* PDF preview — sin cambios */}
            <div>
              <span className="lbl" style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>Vista previa</span>
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface)', padding: 18, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mark s={18} />
                  <div style={{ height: 9, width: '55%', borderRadius: 6, background: 'var(--ink-soft)' }} />
                </div>
                <Lines rows={2} />
                <div style={{ height: 64, borderRadius: 6 }} className="photo" />
                <div style={{ height: 6, width: '50%', borderRadius: 6, background: 'var(--line)' }} />
                <div style={{ height: 44, border: '1px solid var(--line)', borderRadius: 6 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}
