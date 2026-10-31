import { useNav } from '../../context/NavContext';
import { Mark } from '../../components/ui/Mark';
import { Footer } from '../../components/Footer';

export function AuthShell({ children }) {
  const { go } = useNav();
  return (
    <div className="screen">
      <div className="authwrap">
        <aside className="authbrand">
          <div className="ab-top">
            <div className="brand" style={{ cursor: 'pointer' }} onClick={() => go('1A')}>
              <Mark s={30} stroke="#f4f1ea" fill="#bd5d3a" />
              <span className="wm">cuadra</span>
            </div>
          </div>
          <div className="ab-mid">
            <h2 className="ab-h">Comprá y alquilá<br />sabiendo si el precio<br />es justo.</h2>
            <p className="ab-sub">Cada aviso muestra cómo se compara con el mercado de la zona. Sin vueltas.</p>
          </div>
          <div className="ab-foot">
            <span className="ab-q">"Supe en un segundo que pagaba de menos."</span>
            <span className="ab-by">— Matías, inquilino en el Cordón</span>
          </div>
        </aside>

        <div className="authform scroll-y">
          <div className="authcard">{children}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
