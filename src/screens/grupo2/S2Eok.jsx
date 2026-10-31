import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { Btn } from '../../components/ui/Btn';
import { Ic } from '../../components/ui/Ic';

export function S2Eok() {
  const { go } = useNav();
  return (
    <Screen active="publicar">
      <div className="body" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--below-tint)', color: 'var(--below)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
            <Ic n="check" size={38} sw={2.2} />
          </div>
          <h1 className="h1">Tu aviso fue publicado</h1>
          <p className="lbl" style={{ marginTop: 10 }}>Ya está visible para los inquilinos que buscan en tu zona.</p>
          <div style={{ marginTop: 26, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Btn variant="primary" onClick={() => go('1C')}>Ver mi aviso</Btn>
            <Btn onClick={() => go('2F')}>Ver mis publicaciones</Btn>
          </div>
        </div>
      </div>
    </Screen>
  );
}
