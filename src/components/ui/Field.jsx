import { useState } from 'react';
import { Ic } from './Ic';

const inputStyle = {
  border: 'none', outline: 'none', background: 'transparent',
  flex: 1, fontSize: 'inherit', fontFamily: 'var(--sans)',
  color: 'var(--ink)', width: '100%', minWidth: 0,
};

export function Field({ label, placeholder, big, error, value, onChange, icon, style, type = 'text' }) {
  const isPassword = type === 'password';
  const [reveal, setReveal] = useState(false);
  return (
    <div className="field-wrap" style={style}>
      {label && <span className="lbl">{label}</span>}
      <div className={['field', big ? 'field--big' : '', error ? 'field--err' : ''].filter(Boolean).join(' ')}>
        {icon && <Ic n={icon} size={big ? 18 : 16} />}
        {onChange !== undefined
          ? <input type={isPassword && reveal ? 'text' : type} value={value ?? ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={inputStyle} />
          : <span className={value ? '' : 'ph'}>{value || placeholder}</span>
        }
        {isPassword && onChange !== undefined && (
          <button
            type="button"
            onClick={() => setReveal(r => !r)}
            title={reveal ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', padding: 0, margin: 0, color: 'var(--ink-2)', cursor: 'pointer', flex: 'none' }}
          >
            <Ic n={reveal ? 'eyeOff' : 'eye'} size={big ? 18 : 16} />
          </button>
        )}
      </div>
      {error && <span className="err-msg">{error}</span>}
    </div>
  );
}
