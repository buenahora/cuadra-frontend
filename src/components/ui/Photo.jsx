import { useState } from 'react';
import { Ic } from './Ic';

export function Photo({ w = '100%', h = 120, label, src, style }) {
  const [err, setErr] = useState(false);

  if (src && !err) {
    return (
      <div className="photo photo--img" style={{ width: w, height: h, ...style }}>
        <img src={src} alt="" crossOrigin="anonymous" onError={() => setErr(true)} />
        {label && <span className="ph-lab" style={{ zIndex: 3 }}>{label}</span>}
      </div>
    );
  }

  return (
    <div className="photo" style={{ width: w, height: h, ...style }}>
      <span className="ph-ic"><Ic n="image" size={18} /></span>
      {label && <span className="ph-lab">{label}</span>}
    </div>
  );
}
