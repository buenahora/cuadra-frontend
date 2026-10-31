import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { Btn } from '../../components/ui/Btn';
import { Ic } from '../../components/ui/Ic';

const MSGS = [
  { n: 'Matías Fernández', d: 'Hoy 14:30', open: true,  txt: 'Hola, estoy interesado en el apartamento. ¿Cuándo podríamos coordinar una visita?' },
  { n: 'Lucía Methol',     d: 'Ayer',       open: false },
  { n: 'Andrés Pereira',   d: '30 may',     open: false },
];

export function S2G() {
  const { go } = useNav();
  return (
    <Screen active="avisos">
      <div className="body scroll-y">
        <div className="pad" style={{ maxWidth: 820, margin: '0 auto', width: '100%' }}>
          <a className="crumbs" style={{ marginBottom: 8 }} onClick={() => go('2F')}>
            <Ic n="left" size={15} /> Mis publicaciones
          </a>
          <h1 className="h1">Consultas para "Monoambiente en el Cordón"</h1>
          <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
            {MSGS.map((m, i) => (
              <div key={i} className="card card--pad">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <span className="avatar" style={{ width: 38, height: 38, fontSize: 14, margin: 0 }}>{m.n[0]}</span>
                    <div style={{ whiteSpace: 'nowrap' }}>
                      <b style={{ fontSize: 15, fontWeight: 600 }}>{m.n}</b>{' '}
                      <span className="helper">· {m.d}</span>
                    </div>
                  </div>
                  <Ic n="caretD" size={18} style={{ color: 'var(--ink-faint)', transform: m.open ? '' : 'rotate(-90deg)' }} />
                </div>
                {m.open && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 14.5, margin: '0 0 14px', color: 'var(--ink-2)', lineHeight: 1.6 }}>{m.txt}</p>
                    <div className="field field--area" style={{ height: 78 }}>
                      <span className="ph">Escribí tu respuesta…</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                      <Btn variant="primary" icon="send">Responder</Btn>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}
