import { useEffect, useRef, useState } from 'react';
import { useNav } from '../context/NavContext';
import { Mark } from './ui/Mark';
import { Btn } from './ui/Btn';
import { isAuthenticated, logout } from '../api/auth';
import { useFavorites } from '../lib/favorites';

function ProfileMenu() {
  const [abierto, setAbierto] = useState(false);
  const raizRef = useRef(null);

  // Los listeners solo existen con el menú abierto: la barra está en todas las pantallas.
  useEffect(() => {
    if (!abierto) return undefined;
    const alTocar = (e) => {
      if (!raizRef.current?.contains(e.target)) setAbierto(false);
    };
    const alTeclear = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('pointerdown', alTocar);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('pointerdown', alTocar);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  return (
    <div className="profile" ref={raizRef}>
      <button
        type="button"
        className="avatar"
        title="Perfil"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        M
      </button>
      {abierto && (
        <div className="profile-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => logout()}>Cerrar sesión</button>
        </div>
      )}
    </div>
  );
}

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
        ? <ProfileMenu />
        : (
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn sm onClick={() => go('LA')}>Iniciar sesión</Btn>
            <Btn sm variant="primary" onClick={() => go('LB')}>Crear cuenta</Btn>
          </div>
        )}
    </div>
  );
}
