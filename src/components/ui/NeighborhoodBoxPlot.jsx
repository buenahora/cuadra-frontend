import { useState } from 'react';
import { formatPrice } from '../../lib/format';

const H = 220;
// Alto reservado para la etiqueta del barrio debajo de cada caja -- el
// track (caja+bigotes) y la grilla de referencia deben medir exactamente
// H los dos, si no, el track queda más corto que la grilla (por compartir
// contenedor flex con el label) y las cajas quedan desalineadas del eje.
const LABEL_H = 26;
const COL_W = 56;
const COL_GAP = 22;
const TARGET_TICKS = 6;

// Redondea el paso entre líneas de referencia a un número "lindo"
// (1/2/5 * potencia de 10), como hacen d3/Excel para los ejes.
function niceStep(range, targetTicks) {
  const rough = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * mag;
}

// Boxplot real (3D): caja = Q1-Q3, línea = mediana, bigotes = mín-máx.
// Todos los barrios con muestra confiable entran, con scroll horizontal --
// las líneas de referencia son siempre precios redondos (paso "lindo"), el
// precio máximo real no se marca aparte.
export function NeighborhoodBoxPlot({ data, selectedZoneId, onSelect }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  if (!data.length) return null;

  const rawMin = Math.min(...data.map((d) => d.min));
  const rawMax = Math.max(...data.map((d) => d.max));
  const step = niceStep(Math.max(rawMax - rawMin, 1), TARGET_TICKS);
  const scaleMin = Math.max(0, Math.floor(rawMin / step) * step);
  const scaleMax = Math.ceil(rawMax / step) * step;
  const span = scaleMax - scaleMin || 1;

  const ticks = [];
  for (let v = scaleMin; v <= scaleMax + step / 2; v += step) ticks.push(v);

  const pct = (v) => ((v - scaleMin) / span) * 100;
  const contentWidth = data.length * COL_W + Math.max(0, data.length - 1) * COL_GAP;

  return (
    <div className="boxplot">
      <div className="boxplot-scale" style={{ height: H }}>
        {ticks.map((t) => (
          <span key={t} style={{ bottom: pct(t) + '%' }}>{formatPrice(t)}</span>
        ))}
      </div>

      <div className="boxplot-scroll">
        <div className="boxplot-plot" style={{ height: H + LABEL_H, minWidth: contentWidth }}>
          <div className="boxplot-grid" style={{ height: H }}>
            {ticks.map((t) => (
              <div key={t} className="boxplot-gridline" style={{ bottom: pct(t) + '%' }} />
            ))}
          </div>

          <div className="boxplot-cols">
            {data.map((d, i) => {
              const on = d.zone_id === selectedZoneId;
              const minPct = pct(d.min);
              const maxPct = pct(d.max);
              const q1Pct = pct(d.q1);
              const q3Pct = pct(d.q3);
              const medianPct = pct(d.median);
              const boxH = Math.max(q3Pct - q1Pct, 0);
              const medianInBox = boxH ? ((medianPct - q1Pct) / boxH) * 100 : 50;
              const tooltipLeft = i > data.length - 3;
              return (
                <div
                  key={d.zone_id}
                  className={'boxplot-col' + (on ? ' boxplot-col--on' : '')}
                  style={{ minWidth: COL_W }}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
                  onClick={() => onSelect?.(d.zone_id)}
                >
                  <div className="boxplot-track" style={{ height: H }}>
                    <div className="boxplot-whisker" style={{ bottom: minPct + '%', height: (maxPct - minPct) + '%' }} />
                    <div className="boxplot-cap" style={{ bottom: minPct + '%' }} />
                    <div className="boxplot-cap" style={{ bottom: maxPct + '%' }} />
                    <div className="boxplot-box" style={{ bottom: q1Pct + '%', height: boxH + '%' }}>
                      <div className="boxplot-median" style={{ bottom: medianInBox + '%' }} />
                    </div>
                  </div>
                  <span className="boxplot-label">{d.barrio}</span>

                  {hoverIdx === i && (
                    <div className={'boxplot-tooltip' + (tooltipLeft ? ' boxplot-tooltip--left' : '')}>
                      <strong>{d.barrio}</strong>
                      <div className="boxplot-tooltip-row"><span>Máx</span><span>{formatPrice(d.max)}</span></div>
                      <div className="boxplot-tooltip-row"><span>Q3</span><span>{formatPrice(d.q3)}</span></div>
                      <div className="boxplot-tooltip-row boxplot-tooltip-row--strong"><span>Mediana</span><span>{formatPrice(d.median)}</span></div>
                      <div className="boxplot-tooltip-row"><span>Q1</span><span>{formatPrice(d.q1)}</span></div>
                      <div className="boxplot-tooltip-row"><span>Mín</span><span>{formatPrice(d.min)}</span></div>
                      {d.avisos != null && (
                        <div className="boxplot-tooltip-row boxplot-tooltip-row--soft">
                          <span>Avisos activos</span><span>{d.avisos}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
