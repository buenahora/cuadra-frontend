import { SCREENS, GROUPS, FLOWS } from '../../data/screens';
import { Ic } from '../../components/ui/Ic';

function Thumb({ code, go }) {
  const s = SCREENS[code];
  if (!s) return null;
  const C = s.comp;
  return (
    <div className="thumb" onClick={() => go(code)}>
      <div className="cap">
        <span className="code">{code}</span>
        <span className="ttl">{s.title}</span>
      </div>
      <div className="frame">
        <div className="scaler"><C /></div>
      </div>
    </div>
  );
}

function FlowRow({ codes, go }) {
  return (
    <div className="flowrow">
      {codes.map((c, i) => (
        <div key={c + i} style={{ display: 'contents' }}>
          {i > 0 && <span className="arrow"><Ic n="right" size={18} /></span>}
          <Thumb code={c} go={go} />
        </div>
      ))}
    </div>
  );
}

export function MapaView({ go }) {
  return (
    <div className="overview">
      <div className="intro">
        <div className="kicker">Alta fidelidad</div>
        <h1 className="boardtitle">Cuadra</h1>
      </div>

      {/* Auth flow */}
      <div className="group">
        <div className="ghead">
          <span className="gnum">Acceso</span>
          <h2 className="h2" style={{ fontSize: 26 }}>Solo para consultar</h2>
        </div>
        <p className="persona">Buscar, ver el detalle y comparar no requieren cuenta. La sesión se pide recién al tocar "Contactar al propietario".</p>
        <FlowRow codes={['1C','LA','1D','1D-ok']} go={go} />
        <div className="branchnote"><span><Ic n="right" size={14} /></span> Sin cuenta → registro en el momento</div>
        <FlowRow codes={['LA','LB','1D']} go={go} />
      </div>

      {/* User groups */}
      {[1, 2, 3].map((g) => (
        <div className="group" key={g}>
          <div className="ghead">
            <span className="gnum">Grupo {g}</span>
            <h2 className="h2" style={{ fontSize: 26 }}>{GROUPS[g].name}</h2>
          </div>
          <p className="persona">{GROUPS[g].persona}</p>
          <FlowRow codes={FLOWS[g].main} go={go} />
          {FLOWS[g].branches.map((b, i) => (
            <div key={i}>
              <div className="branchnote"><span><Ic n="right" size={14} /></span> {b.label}</div>
              <FlowRow codes={b.codes} go={go} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
