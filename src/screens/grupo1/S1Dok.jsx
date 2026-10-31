import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { Btn } from '../../components/ui/Btn';
import { Ic } from '../../components/ui/Ic';

export function S1Dok() {
  const { go } = useNav();
  return (
    <Screen active="buscar">
      <div className="body" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--below-tint)', color: 'var(--below)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
            <Ic n="check" size={38} sw={2.2} />
          </div>
          <h1 className="h1">Tu consulta fue enviada</h1>
          <p className="lbl" style={{ marginTop: 10 }}>El propietario recibió tu mensaje y se pondrá en contacto contigo.</p>
          <div style={{ marginTop: 26, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Btn variant="primary" onClick={() => go('1B')}>Volver a buscar</Btn>
            <Btn onClick={() => go('2F')}>Ver mis consultas</Btn>
          </div>
        </div>
      </div>
    </Screen>
  );
}
