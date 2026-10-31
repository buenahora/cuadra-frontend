import { useState, useEffect } from 'react';
import { SCREENS, SCREEN_ORDER } from '../../data/screens';
import { Btn } from '../../components/ui/Btn';

export function Viewer({ code, go }) {
  const s = SCREENS[code];
  const C = s?.comp;
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      const avail = Math.min(window.innerWidth - 48, 1280);
      setScale(Math.min(1, avail / 1280));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const idx  = SCREEN_ORDER.indexOf(code);
  const prev = idx > 0 ? SCREEN_ORDER[idx - 1] : null;
  const next = idx < SCREEN_ORDER.length - 1 ? SCREEN_ORDER[idx + 1] : null;

  if (!C) return null;

  return (
    <div className="viewer">
      <div className="vbar" style={{ width: 1280 * scale }}>
        <div className="navbtns">
          <Btn sm icon="left"  disabled={!prev} onClick={() => prev && go(prev)}>Anterior</Btn>
          <Btn sm iconR="right" disabled={!next} onClick={() => next && go(next)}>Siguiente</Btn>
        </div>
        <div style={{ flex: 1 }} />
      </div>

      <div className="stagewrap" style={{ width: 1280 * scale, height: 840 * scale }}>
        <div className="stage" style={{ width: 1280, height: 840, transform: `scale(${scale})` }}>
          <C />
        </div>
      </div>
    </div>
  );
}
