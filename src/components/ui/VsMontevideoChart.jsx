import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '../../lib/format';

const H = 170;
const PAD_L = 14, PAD_R = 14, PAD_T = 30;

// Todas las medianas de barrio como puntos sobre una misma recta de precio,
// el barrio elegido resaltado -- muestra de un vistazo dónde cae respecto
// del resto de Montevideo. Línea punteada vertical = mediana general.
export function VsMontevideoChart({ zones, selectedZoneId, montevideoMedian, onSelect }) {
  const svgRef = useRef(null);
  const [w, setW] = useState(480);

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

  if (!zones?.length) return null;

  const selected = zones.find((z) => z.zone_id === selectedZoneId);
  const medians = zones.map((z) => z.precio_mediana);
  const lo = Math.min(...medians), hi = Math.max(...medians);
  const pad = (hi - lo) * 0.14 || 1;
  const iw = w - PAD_L - PAD_R;
  const X = (v) => PAD_L + ((v - (lo - pad)) / ((hi + pad) - (lo - pad))) * iw;
  const cy = PAD_T + 40;

  const diff = selected && montevideoMedian
    ? (selected.precio_mediana - montevideoMedian) / montevideoMedian * 100
    : null;
  const above = diff != null && diff >= 0;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${w} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      <line x1={PAD_L} x2={w - PAD_R} y1={cy} y2={cy} stroke="var(--line)" strokeWidth="2" />

      {montevideoMedian != null && (
        <>
          <line x1={X(montevideoMedian)} x2={X(montevideoMedian)} y1={cy - 34} y2={cy + 34}
            stroke="var(--ink-faint)" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x={X(montevideoMedian)} y={cy - 42} textAnchor="middle" className="axl">
            mediana MVD {formatPrice(montevideoMedian)}
          </text>
        </>
      )}

      {zones.map((z) => {
        const on = z.zone_id === selectedZoneId;
        return (
          <circle
            key={z.zone_id}
            cx={X(z.precio_mediana)} cy={cy} r={on ? 9 : 5.5}
            fill={on ? 'var(--clay)' : 'var(--border-2)'}
            stroke={on ? '#fff' : 'none'} strokeWidth={on ? 2.5 : 0}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
            onClick={() => onSelect?.(z.zone_id)}
          >
            <title>{z.barrio} · {formatPrice(z.precio_mediana)}</title>
          </circle>
        );
      })}

      {selected && diff != null && (
        <>
          <text x={X(selected.precio_mediana)} y={cy + 44} textAnchor="middle"
            style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, fill: above ? 'var(--above)' : 'var(--below)' }}>
            {above ? '+' : ''}{diff.toFixed(1)}% vs. Montevideo
          </text>
          <text x={X(selected.precio_mediana)} y={cy + 62} textAnchor="middle" className="axl">
            {selected.barrio}
          </text>
        </>
      )}
    </svg>
  );
}
