import { useEffect, useRef, useState } from 'react';

const ALL_MONTHS = ['Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun'];

export function TrendChart({ h = 150, pts: ptsIn, priceLabels, months: monthsIn }) {
  const [hover, setHover] = useState(null); // { idx, x, y }
  const svgRef = useRef(null);
  // El viewBox sigue el ancho real del contenedor (medido, no fijo en 520)
  // -- si no, con preserveAspectRatio por default el SVG hace letterboxing
  // cuando el contenedor es más ancho que alto, y el mapeo mouse->x del
  // hover queda desalineado respecto de lo que se ve dibujado.
  const [w, setW] = useState(520);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width;
      if (width) setW(width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pts = ptsIn ?? [38, 42, 40, 46, 44, 50, 48, 55, 53, 58, 56, 62];
  const pmax = Math.max(...pts);
  const pmin = Math.min(...pts);
  const span = pmax - pmin || 1;
  const normalized = pts.map(p => 30 + ((p - pmin) / span) * 36);

  const maxY = 70, padL = 14, padR = 14, baseY = h - 26;
  const coords = normalized.map((p, i) => [
    padL + i * ((w - padL - padR) / (normalized.length - 1)),
    baseY - (p / maxY) * (baseY - 12),
  ]);
  const line = coords.map((c, i) => (i ? 'L' : 'M') + c[0].toFixed(1) + ' ' + c[1].toFixed(1)).join(' ');
  const area = line + ` L ${coords[coords.length - 1][0].toFixed(1)} ${baseY} L ${coords[0][0].toFixed(1)} ${baseY} Z`;
  // `months` permite rotular el eje con los periodos reales de la serie
  // (3D lee /market/snapshots, que no siempre arranca en julio).
  const months = monthsIn ?? ALL_MONTHS;
  const axisTicks = coords
    .map((c, i) => ({ x: c[0], label: months[i] }))
    .filter((t, i) => i % 2 === 0 && t.label);

  const handleMouseMove = (e) => {
    if (!priceLabels) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) / rect.width * w;
    let closest = 0, minDist = Infinity;
    coords.forEach((c, i) => {
      const d = Math.abs(c[0] - svgX);
      if (d < minDist) { minDist = d; closest = i; }
    });
    setHover({ idx: closest, x: coords[closest][0], y: coords[closest][1] });
  };

  // Tooltip geometry
  const TW = 92, TH = 38;
  const tx = hover ? Math.max(2, Math.min(hover.x - TW / 2, w - TW - 2)) : 0;
  const ty = hover ? Math.max(4, hover.y - TH - 10) : 0;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: '100%', height: h, display: 'block', cursor: priceLabels ? 'crosshair' : 'default' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id="cuadraTrend" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bd5d3a" stopOpacity="0.18" />
          <stop offset="1" stopColor="#bd5d3a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={padL} y1={12 + i * ((baseY - 12) / 3)} x2={w - padR} y2={12 + i * ((baseY - 12) / 3)}
          stroke="#ece6da" strokeWidth="1" />
      ))}

      <path d={area} fill="url(#cuadraTrend)" />
      <path d={line} fill="none" stroke="#bd5d3a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {coords.map((c, i) => i % 2 === 1 && (
        <circle key={i} cx={c[0]} cy={c[1]} r="3" fill="#fff" stroke="#bd5d3a" strokeWidth="2" />
      ))}

      {axisTicks.map((t) => (
        <text key={t.x} x={t.x} y={h - 6} textAnchor="middle"
          fontSize="11" fill="#9a9384" fontFamily="'Space Mono', monospace">{t.label}</text>
      ))}

      {/* Hover tooltip */}
      {hover && priceLabels && (
        <g>
          <line x1={hover.x} y1={12} x2={hover.x} y2={baseY}
            stroke="#bd5d3a" strokeWidth="1" strokeDasharray="4 3" opacity="0.45" />
          <circle cx={hover.x} cy={hover.y} r="5" fill="#bd5d3a" stroke="#fff" strokeWidth="2" />
          <rect x={tx} y={ty} width={TW} height={TH} rx="6" fill="#211f1c" fillOpacity="0.9" />
          <text x={tx + TW / 2} y={ty + 13} fontSize="10" fill="#9a9384"
            textAnchor="middle" fontFamily="'Space Mono', monospace">
            {months[hover.idx]}
          </text>
          <text x={tx + TW / 2} y={ty + 29} fontSize="13" fill="#f4f1ea"
            textAnchor="middle" fontFamily="'Space Mono', monospace" fontWeight="700">
            {priceLabels[hover.idx]}
          </text>
        </g>
      )}
    </svg>
  );
}
