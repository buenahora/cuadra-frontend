import { useState, useEffect, useCallback } from 'react';
import { procesarCallback } from './lib/cognito';
import './screens/index.js';
import { SCREENS } from './data/screens';
import { NavCtx } from './context/NavContext';
import { Ic } from './components/ui/Ic';

function parseHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [code, query] = raw.split('?');
  return {
    route: SCREENS[code] ? code : '1A',
    params: query ? Object.fromEntries(new URLSearchParams(query)) : {},
  };
}

export default function App() {
  const [route,    setRoute]    = useState(() => parseHash().route);
  const [params,   setParams]   = useState(() => parseHash().params);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    const s = SCREENS[route];
    document.title = s ? `${s.title} · Cuadra` : 'Cuadra';
  }, [route]);

  // La vuelta del hosted UI cae en la raíz con ?code=... en la query, que el
  // router por hash no mira. Se canjea una sola vez al arrancar; si no era
  // una vuelta de login, procesarCallback() no hace nada.
  useEffect(() => {
    procesarCallback()
      .then((hubo) => { if (hubo) setToastMsg('Sesión iniciada'); })
      .catch((err) => setToastMsg(err.message || 'No se pudo completar el inicio de sesión'));
  }, []);

  useEffect(() => {
    const onHash = () => {
      const parsed = parseHash();
      setRoute(parsed.route);
      setParams(parsed.params);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = useCallback((code, params, opts) => {
    const qs = params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    const hash = '#/' + code + qs;
    if (opts?.replace) {
      location.replace(hash);
    } else {
      location.hash = hash;
    }
  }, []);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const s = SCREENS[route];
  const Comp = s?.comp;

  return (
    <NavCtx.Provider value={{ go, toast, params }}>
      {Comp ? <Comp /> : null}

      {toastMsg && (
        <div className="toast">
          <span className="ico"><Ic n="check" size={13} sw={2.6} /></span>
          {toastMsg}
        </div>
      )}
    </NavCtx.Provider>
  );
}
