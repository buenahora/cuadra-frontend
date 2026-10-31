export function MarketBar({ markerPct = 35, median = 50, min = '$14.000', med = '$20.500', max = '$29.000' }) {
  return (
    <div className="mbar-wrap">
      <div className="mbar">
        <div className="median" style={{ left: median + '%' }} />
        <div className="marker"  style={{ left: markerPct + '%' }} />
      </div>
      <div className="mbar-scale">
        <span>mín <b>{min}</b></span>
        <span>mediana <b>{med}</b></span>
        <span>máx <b>{max}</b></span>
      </div>
    </div>
  );
}
