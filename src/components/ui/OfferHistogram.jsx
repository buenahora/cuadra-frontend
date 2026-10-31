import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '../../lib/format';

const H = 260;
const PAD_L = 62, PAD_R = 50, PAD_T = 26, PAD_B = 42;

// Histograma de oferta: barras grises = total Montevideo, barras clay
// superpuestas = subconjunto del barrio elegido, línea punteada = %
// acumulado (eje derecho). El ancho sigue al contenedor (medido, no fijo)
// para que el mapeo de hover no quede desalineado si el contenedor no
// mide lo que dice el viewBox por default.
export function OfferHistogram({ bins, montevideoMedian, selectedMedian, selectedLabel }) {
  const svgRef = useRef(null);
  const [w, setW] = useState(760);
  const [hover, setHover] = useState(null);

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

  if (!bins?.length) return null;

  const iw = w - PAD_L - PAD_R;
  const ih = H - PAD_T - PAD_B;
  const maxCount = Math.max(...bins.map((b) => b.count), 1) * 1.12;
  const step = iw / bins.length;
  const barW = step * 0.74;
  const barX = (i) => PAD_L + step * i + step * 0.13;
  const Yc = (c) => PAD_T + ih - (c / maxCount) * ih;
  const Yp = (frac) => PAD_T + ih - frac * ih;
  const lo = bins[0].from, hi = bins[bins.length - 1].to;
  const X = (v) => PAD_L + ((v - lo) / (hi - lo)) * iw;

  const cumPath = bins
    .map((b, i) => `${i ? 'L' : 'M'} ${barX(i) + barW / 2} ${Yp(b.cum)}`)
    .join(' ')
    .replace(/^L/, 'M');

  const markers = [
    montevideoMedian != null && { v: montevideoMedian, color: 'var(--ink-faint)', label: 'mediana MVD ' + formatPrice(montevideoMedian), dy: -6 },
    selectedMedian != null && { v: selectedMedian, color: 'var(--clay)', label: (selectedLabel || 'barrio') + ' ' + formatPrice(selectedMedian), dy: 14 },
  ].filter(Boolean);

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef} viewBox={`0 0 ${w} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={PAD_L} x2={w - PAD_R} y1={Yc(maxCount * t)} y2={Yc(maxCount * t)} stroke="var(--line)" strokeWidth="1" />
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <text key={t} x={PAD_L - 10} y={Yc(maxCount * t) + 4} textAnchor="end" className="axl">{Math.round(maxCount * t)}</text>
        ))}

        {bins.map((b, i) => {
          const hTot = Math.max(2, ih - (Yc(b.count) - PAD_T));
          const hSel = b.selCount > 0 ? Math.max(2, (b.selCount / maxCount) * ih) : 0;
          return (
            <g key={i}>
              <rect x={barX(i)} y={Yc(b.count)} width={barW} height={hTot} rx={5}
                fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1" opacity={hover === i ? 0.72 : 1} />
              {hSel > 0 && (
                <rect x={barX(i)} y={PAD_T + ih - hSel} width={barW} height={hSel} rx={5}
                  fill="var(--clay)" fillOpacity={0.9} opacity={hover === i ? 0.72 : 1} />
              )}
              <rect x={barX(i) - step * 0.13} y={PAD_T} width={step} height={ih} fill="transparent"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover((c) => c === i ? null : c)} />
              <text x={barX(i) + barW / 2} y={H - PAD_B + 24} textAnchor="middle" className="axl">{formatPrice(b.from)}</text>
            </g>
          );
        })}

        <line x1={PAD_L} x2={w - PAD_R} y1={PAD_T + ih} y2={PAD_T + ih} stroke="var(--border-2)" strokeWidth="1.5" />

        <path d={cumPath} fill="none" stroke="var(--in)" strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" opacity="0.75" />
        {[0.25, 0.5, 0.75, 1].map((p) => (
          <text key={p} x={w - PAD_R + 10} y={Yp(p) + 4} className="axl" style={{ fill: 'var(--in)' }}>{p * 100}%</text>
        ))}
        <text x={w - PAD_R + 10} y={PAD_T - 8} className="axl" style={{ fill: 'var(--in)' }}>acum.</text>

        {markers.map((m) => (
          <g key={m.label}>
            <line x1={X(m.v)} x2={X(m.v)} y1={PAD_T - 2} y2={PAD_T + ih} stroke={m.color} strokeWidth="1.8" strokeDasharray="4 4" />
            <text
              x={X(m.v) + (X(m.v) > w - PAD_R - 150 ? -8 : 8)}
              y={PAD_T + 8 + m.dy}
              textAnchor={X(m.v) > w - PAD_R - 150 ? 'end' : 'start'}
              style={{ fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 700, fill: m.color }}
            >{m.label}</text>
          </g>
        ))}
      </svg>

      {hover != null && bins[hover] && (
        <div style={{
          position: 'absolute', pointerEvents: 'none', left: barX(hover) / w * 100 + '%', top: 4,
          transform: 'translateX(-10%)', background: 'var(--ink)', color: 'var(--paper)', fontSize: 12.5,
          lineHeight: 1.5, padding: '9px 12px', borderRadius: 9, boxShadow: 'var(--shadow)', whiteSpace: 'nowrap', zIndex: 5,
        }}>
          <b style={{ fontFamily: 'var(--mono)' }}>{formatPrice(bins[hover].from)}–{formatPrice(bins[hover].to)}</b>
          <div style={{ color: 'rgba(244,241,234,.7)' }}>
            {bins[hover].count} avisos{bins[hover].selCount > 0 ? ` · ${selectedLabel}: ${bins[hover].selCount}` : ''}
          </div>
        </div>
      )}
    </div>
  );
}
