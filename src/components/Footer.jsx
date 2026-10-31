import { useNav } from '../context/NavContext';
import { Mark } from './ui/Mark';
import { Ic } from './ui/Ic';

function Col({ label, links }) {
  return (
    <div>
      <div className="kicker" style={{ marginBottom: 16 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {links.map(({ text, code, href }) =>
          href ? (
            <a key={text} href={href} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: 'var(--ink-2)', textDecoration: 'none', cursor: 'pointer', transition: 'color .12s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--clay)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-2)'}>
              {text}
            </a>
          ) : (
            <FooterLink key={text} text={text} code={code} />
          )
        )}
      </div>
    </div>
  );
}

function FooterLink({ text, code }) {
  const { go } = useNav();
  return (
    <span
      onClick={() => code && go(code)}
      style={{ fontSize: 14, color: 'var(--ink-2)', cursor: code ? 'pointer' : 'default', transition: 'color .12s' }}
      onMouseEnter={e => { if (code) e.currentTarget.style.color = 'var(--clay)'; }}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-2)'}
    >
      {text}
    </span>
  );
}

export function Footer() {
  const { go } = useNav();

  return (
    <footer style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '44px 28px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr', gap: 40, paddingBottom: 40 }}>

          {/* Marca */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }} onClick={() => go('1A')}>
              <Mark s={22} />
              <span style={{ fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 20, letterSpacing: '-.03em', color: 'var(--ink)' }}>
                cuadra
              </span>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 15.5, lineHeight: 1.65, color: 'var(--ink-soft)', maxWidth: 270, margin: '0 0 22px' }}>
              Comprá y alquilá sabiendo si el precio es justo. Cada aviso comparado con el mercado real de la zona.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {['Montevideo', 'Uruguay'].map(t => (
                <span key={t} className="tag-note" style={{ fontSize: 12 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Inquilinos */}
          <Col label="Inquilinos" links={[
            { text: 'Buscar apartamentos', code: '1A' },
            { text: 'Buscar cerca de un punto', code: '1E' },
            { text: 'Comparar opciones', code: '1F' },
            { text: 'Iniciar sesión', code: 'LA' },
          ]} />

          {/* Propietarios */}
          <Col label="Propietarios" links={[
            { text: 'Consulta de mercado', code: '2A' },
            { text: 'Publicar apartamento', code: '2B' },
            { text: 'Mis publicaciones', code: '2F' },
            { text: 'Para corredores', code: '3B' },
          ]} />

          {/* Plataforma */}
          <Col label="Plataforma" links={[
            { text: 'Acerca de Cuadra', code: null },
            { text: 'Política de privacidad', code: null },
            { text: 'Términos de uso', code: null },
            { text: 'Análisis de zona', code: '3A' },
          ]} />

        </div>
      </div>

      {/* Barra inferior */}
      <div style={{ borderTop: '1px solid var(--line)', padding: '16px 28px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '.06em' }}>
            © 2026 CUADRA
            <span style={{ margin: '0 10px', opacity: .4 }}>·</span>
            DATOS BASADOS EN AVISOS PÚBLICOS
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Ic n="pin" size={13} style={{ color: 'var(--ink-faint)' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '.06em' }}>
              MONTEVIDEO, URUGUAY
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
