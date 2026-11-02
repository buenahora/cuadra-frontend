import { useState } from 'react';
import { useNav } from '../../context/NavContext';
import { AuthShell } from './AuthShell';
import { Field } from '../../components/ui/Field';
import { Btn } from '../../components/ui/Btn';
import { Ic } from '../../components/ui/Ic';
import { Check } from '../../components/ui/Controls';
import { register, entrarConGoogle, entrarConCognito, usaCognito } from '../../api/auth';
import { ApiError } from '../../api/client';

function OrDiv() {
  return (
    <div className="ordiv">
      <span className="ln" /><span style={{ lineHeight: 1, textAlign: 'center' }}>o</span><span className="ln" />
    </div>
  );
}

export function SLB() {
  const { go, params } = useNav();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [accepted, setAccepted] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Con el pool configurado el alta la hace Cognito: la API rechaza
  // /auth/register con 404 y el formulario de acá no tendría a dónde ir.
  const porCognito = usaCognito();

  const salirAlHostedUI = (ir) => async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await ir();  // navega fuera del sitio
    } catch {
      setError('No pudimos abrir el registro. Probá de nuevo.');
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (submitting) return;
    setError(null);
    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!accepted) {
      setError('Tenés que aceptar los términos y la política de privacidad.');
      return;
    }
    setSubmitting(true);
    try {
      await register({ nombre_completo: nombre, email, telefono: telefono || undefined, password });
      go(params.redirect || '1A', params.id ? { id: params.id } : undefined);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Ya existe una cuenta con ese email.'
          : 'No pudimos crear la cuenta. Revisá los datos e intentá de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <a className="crumbs" style={{ marginBottom: 18 }} onClick={() => go('LA', params)}>
        <Ic n="left" size={15} /> Volver
      </a>
      <div className="kicker" style={{ marginBottom: 10 }}>Acceso</div>
      <h1 className="h1">Creá tu cuenta</h1>
      <p className="lbl" style={{ marginTop: 8, marginBottom: 16 }}>
        Toma menos de un minuto y podés seguir con tu consulta.
      </p>

      {!porCognito && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Nombre completo" placeholder="Tu nombre" icon="user" value={nombre} onChange={setNombre} />
        <Field label="Email" placeholder="tu@correo.com" icon="mail" value={email} onChange={setEmail} />
        <Field label="Teléfono (opcional)" placeholder="099 123 456" icon="phone" value={telefono} onChange={setTelefono} />
        <div>
          <Field label="Contraseña" placeholder="••••••••" icon="lock" type="password" value={password} onChange={setPassword} />
          <span className="helper">Mínimo 8 caracteres.</span>
        </div>
        <Field
          label="Repetir contraseña"
          placeholder="••••••••"
          icon="lock"
          type="password"
          value={password2}
          onChange={setPassword2}
          error={password2 && password !== password2 ? 'Las contraseñas no coinciden.' : undefined}
        />
      </div>
      )}

      {!porCognito && (
        <>
          <div style={{ marginTop: 12 }}>
            <Check checked={accepted} onChange={setAccepted}>
              <span style={{ fontSize: 13.5 }}>Acepto los términos y la política de privacidad</span>
            </Check>
          </div>

          {error && <p className="err-msg" style={{ marginTop: 12 }}>{error}</p>}

          <Btn variant="primary" block iconR="arrow" disabled={submitting} onClick={submit} style={{ marginTop: 14 }}>
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </Btn>

          <OrDiv />
        </>
      )}

      {porCognito && error && <p className="err-msg" style={{ marginTop: 12 }}>{error}</p>}

      <button
        className="btn btn--block"
        style={{ gap: 10, marginTop: porCognito ? 14 : 0 }}
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
            Crear cuenta con email
          </Btn>
        </>
      )}

      {!porCognito && (
        <p className="authswap">
          ¿Ya tenés cuenta?{' '}
          <a className="authlink" onClick={() => go('LA', params)}>Iniciá sesión</a>
        </p>
      )}
    </AuthShell>
  );
}
