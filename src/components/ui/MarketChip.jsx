import { Ic } from './Ic';

const MAP = {
  below: { cls: 'mchip--below', ic: 'left',  txt: 'Por debajo del mercado', rot: 'rotate(90deg)' },
  in:    { cls: 'mchip--in',                   txt: 'En rango de mercado' },
  above: { cls: 'mchip--above', ic: 'left',  txt: 'Por encima del mercado', rot: 'rotate(-90deg)' },
  muted: { cls: 'mchip--muted',                txt: 'Sin datos de mercado' },
};

export function MarketChip({ level }) {
  // level llega null cuando la zona no tiene muestra suficiente (ver market_position.muestra_confiable) —
  // no asumir "en rango" para no mostrar una comparación de mercado que no existe.
  const m = MAP[level] || MAP.muted;
  return (
    <span className={'mchip ' + m.cls}>
      <span className="dot">
        {m.ic
          ? <Ic n={m.ic} size={11} sw={2.6} style={{ transform: m.rot }} />
          : <span style={{ width: 7, height: 1.6, background: '#fff', borderRadius: 2, boxShadow: '0 -3px 0 #fff, 0 3px 0 #fff' }} />
        }
      </span>
      {m.txt}
    </span>
  );
}
