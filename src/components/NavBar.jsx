import { useNav } from '../context/NavContext';
import { Mark } from './ui/Mark';
import { Btn } from './ui/Btn';
import { isAuthenticated } from '../api/auth';
import { useFavorites } from '../lib/favorites';

export function NavBar({ active }) {
  const { go } = useNav();
  const authenticated = isAuthenticated();
  const favoritos = useFavorites();

  // Publicar sigue visible sin sesión (es el gancho para propietarios), pero
  // manda a login con el destino guardado: SLA/SLB leen `redirect`.
  const goPublicar = () => (authenticated ? go('2A') : go('LA', { redirect: '2A' }));

  return (
    <div className="nav">
      <div className="brand" onClick={() => go('1A')}>
        <Mark s={26} />
        <span className="wm">cuadra</span>
      </div>
      <button className={'navbtn' + (active === 'buscar'   ? ' on' : '')} onClick={() => go('1A')}>Buscar</button>
      <button className={'navbtn' + (active === 'publicar' ? ' on' : '')} onClick={goPublicar}>Publicar</button>
      {/* "Mis avisos" solo tiene sentido con sesión: sin cuenta no hay avisos propios que listar. */}
      {authenticated && (
        <button className={'navbtn' + (active === 'avisos' ? ' on' : '')} onClick={() => go('2F')}>Mis avisos</button>
      )}
      <button className={'navbtn' + (active === 'analisis' ? ' on' : '')} onClick={() => go('3D')}>Análisis</button>
      {/* Guardados vive en localStorage: aparece con o sin sesión, apenas hay algo guardado. */}
      {favoritos.length > 0 && (
        <button className={'navbtn' + (active === 'favoritos' ? ' on' : '')} onClick={() => go('1F')}>
          Guardados
          <span className="badge">{favoritos.length}</span>
        </button>
      )}
      <div className="spacer" />
      {authenticated
        ? <div className="avatar" title="Perfil" onClick={() => go('2F')}>M</div>
        : (
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn sm onClick={() => go('LA')}>Iniciar sesión</Btn>
            <Btn sm variant="primary" onClick={() => go('LB')}>Crear cuenta</Btn>
          </div>
        )}
    </div>
  );
}
