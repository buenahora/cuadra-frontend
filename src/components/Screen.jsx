import { NavBar } from './NavBar';
import { Footer } from './Footer';

export function Screen({ children, active, noFooter }) {
  return (
    <div className="screen">
      <NavBar active={active} />
      {children}
      {!noFooter && <Footer />}
    </div>
  );
}
