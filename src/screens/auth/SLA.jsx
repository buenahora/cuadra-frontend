import { useState } from 'react';
import { useNav } from '../../context/NavContext';
import { AuthShell } from './AuthShell';
import { Field } from '../../components/ui/Field';
import { Btn } from '../../components/ui/Btn';
import { Ic } from '../../components/ui/Ic';
import { login, entrarConGoogle, entrarConCognito, usaCognito } from '../../api/auth';
import { ApiError } from '../../api/client';

function OrDiv() {
  return (
    <div className="ordiv">
      <span className="ln" /><span style={{ lineHeight: 1, textAlign: 'center' }}>o</span><span className="ln" />
    </div>
  );
}

export function SLA() {
  const { go, params } = useNav();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Con el pool configurado la API no acepta contraseñas (responde 404):
  // mostrar el formulario sería ofrecer algo que no puede funcionar.
  const porCognito = usaCognito();

  const salirAlHostedUI = (ir) => async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await ir();  // navega fuera del sitio; lo de abajo solo corre si falla
    } catch {
      setError('No pudimos abrir el inicio de sesión. Probá de nuevo.');
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      go(params.redirect || '1A', params.id ? { id: params.id } : undefined);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Email o contraseña incorrectos.'
          : 'No pudimos iniciar sesión. ¿Está corriendo el backend?'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <a className="crumbs" style={{ marginBottom: 18 }} onClick={() => go('1A')}>
        <Ic n="left" size={15} /> Volver
      </a>
      <div className="kicker" style={{ marginBottom: 10 }}>Acceso</div>
      <h1 className="h1">Iniciá sesión</h1>
      <p className="lbl" style={{ marginTop: 8, marginBottom: 24 }}>
        Ingresá con tu cuenta de Cuadra para enviar tu consulta.
      </p>

      {!porCognito && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Email" placeholder="tu@correo.com" icon="mail" value={email} onChange={setEmail} />
            <div>
              <Field label="Contraseña" placeholder="••••••••" icon="lock" type="password" value={password} onChange={setPassword} />
              <a className="authlink" style={{ display: 'inline-block', fontSize: 13, marginTop: 6 }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>

          {error && <p className="err-msg" style={{ marginTop: 12 }}>{error}</p>}

          <Btn variant="primary" block iconR="arrow" disabled={submitting} onClick={submit} style={{ marginTop: 22 }}>
            {submitting ? 'Ingresando…' : 'Iniciar sesión'}
          </Btn>

          <OrDiv />
        </>
      )}

      {porCognito && error && <p className="err-msg" style={{ marginTop: 12 }}>{error}</p>}

      <button
        className="btn btn--block"
        style={{ gap: 10, marginTop: porCognito ? 22 : 0 }}
        disabled={!porCognito || submitting}
        onClick={salirAlHostedUI(entrarConGoogle)}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: 'var(--ink)', color: '#fff', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13, flex: 'none' }}>G</span>
        {submitting ? 'Abriendo…' : 'Continuar con Google'}
      </button>

      {porCognito && (
        <>
          <OrDiv />
          <Btn variant="primary" block iconR="arrow" disabled={submitting}
               onClick={salirAlHostedUI(entrarConCognito)}>
            Entrar con email
          </Btn>
        </>
      )}

      {!porCognito && (
        <p className="authswap">
          ¿No tenés cuenta?{' '}
          <a className="authlink" onClick={() => go('LB', params)}>Creá una</a>
        </p>
      )}
    </AuthShell>
  );
}
