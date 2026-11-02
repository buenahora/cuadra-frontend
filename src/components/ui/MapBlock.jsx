import { tileUrl } from '../../lib/basemap';

const MAP_AREAS = {
  centro:  { z: 14, cx: 5636, cy: 9888 },
  pocitos: { z: 14, cx: 5637, cy: 9890 },
};

function MapTiles({ area = 'centro' }) {
  const { z, cx, cy } = MAP_AREAS[area] || MAP_AREAS.centro;
  const tiles = [];
  for (let dy = -2; dy < 2; dy++)
    for (let dx = -2; dx < 2; dx++)
      tiles.push([cx + dx, cy + dy]);

  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%', width: 1024, height: 1024,
      transform: 'translate(-50%,-50%)', display: 'grid',
      gridTemplateColumns: 'repeat(4,256px)', gridTemplateRows: 'repeat(4,256px)',
    }}>
      {tiles.map(([x, y]) => (
        <img key={x + '-' + y} alt="" width="256" height="256" loading="lazy" crossOrigin="anonymous"
          src={tileUrl(z, x, y)}
          style={{ display: 'block', width: 256, height: 256 }} />
      ))}
    </div>
  );
}

export function MapBlock({ children, style, area }) {
  return (
    <div className="map" style={style}>
      <MapTiles area={area} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(244,241,234,.10),rgba(33,31,28,.04))', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
}

export function Pin({ label }) {
  return (
    <div className="pin">
      <div className="head"><span className="c" /></div>
      {label && <span className="lab">{label}</span>}
    </div>
  );
}
