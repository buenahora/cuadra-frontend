import { Ic } from './Ic';

export function Steps({ step, labels }) {
  return (
    <div className="steps">
      {labels.map((l, i) => {
        const n = i + 1;
        const state = n < step ? 'done' : n === step ? 'cur' : '';
        return (
          <div key={l} style={{ display: 'contents' }}>
            {i > 0 && <span className={'bar' + (n <= step ? ' done' : '')} />}
            <span className="st">
              <span className={'num ' + state}>
                {n < step ? <Ic n="check" size={14} sw={2.4} /> : n}
              </span>
              <span style={{ color: n === step ? 'var(--ink)' : 'var(--ink-faint)' }}>{l}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
