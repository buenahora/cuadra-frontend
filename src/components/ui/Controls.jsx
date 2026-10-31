import { Ic } from './Ic';

export function Check({ children, checked, onChange }) {
  return (
    <label className="chk" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onChange?.(!checked)}>
      <span className={'box' + (checked ? ' on' : '')}>
        {checked && <Ic n="check" size={13} sw={2.4} />}
      </span>
      {children}
    </label>
  );
}

export function Toggle({ on, onChange }) {
  return (
    <span className={'toggle' + (on ? ' on' : '')} onClick={() => onChange?.(!on)} style={{ cursor: 'pointer' }}>
      <span className="knob" />
    </span>
  );
}

export function Seg({ options, value, onChange }) {
  return (
    <span className="seg">
      {options.map((o) => (
        <button key={o} className={o === value ? 'on' : ''} onClick={() => onChange?.(o)}>{o}</button>
      ))}
    </span>
  );
}

export function Tip({ text }) {
  return <span className="tip" data-tip={text}>?</span>;
}
