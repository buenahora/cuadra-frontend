import { useEffect, useId, useRef, useState } from 'react';
import { Ic } from './Ic';
import { MIN_QUERY, searchPlaces } from '../../api/geocode';

// Nominatim pide como máximo 1 request por segundo. 350 ms es el punto donde
// el dropdown todavía se siente inmediato y una frase tipeada de corrido
// dispara una sola búsqueda.
const DEBOUNCE_MS = 350;
// El click en un ítem llega después del blur del input: el cierre se demora lo
// justo para que el onClick alcance a correr.
const CIERRE_MS = 150;

const VACIO = { q: null, items: [], fallo: false };

/* Buscador de lugares con autocompletado.
 *
 * `value` es el lugar ya elegido (lo escribe el padre, p. ej. después de
 * geocodificar al revés un click en el mapa) y es lo que muestra el input
 * mientras el usuario no esté tipeando. `onSelect` recibe el lugar del
 * geocoder: { id, titulo, detalle, lat, lng, bbox }.
 */
export function PlaceSearch({
  value = '',
  loading = false,
  placeholder = 'Buscá una dirección, barrio o lugar',
  onSelect,
  onReset,
  resetLabel,
}) {
  // null = no se está editando, se muestra `value`. Un string es lo tipeado.
  const [consulta, setConsulta] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [cursor, setCursor] = useState(0);
  // Los resultados guardan de qué consulta salieron: así "en vuelo" y
  // "obsoletos" se derivan en vez de tener que limpiarlos a mano.
  const [datos, setDatos] = useState(VACIO);

  const inputRef = useRef(null);
  const cierreRef = useRef(null);
  const listId = useId();

  const editando = consulta !== null;
  const q = editando ? consulta.trim() : '';
  const consultaActiva = q.length >= MIN_QUERY ? q : null;

  const alDia = consultaActiva !== null && datos.q === consultaActiva;
  const resultados = alDia ? datos.items : [];
  const fallo = alDia && datos.fallo;
  const buscando = consultaActiva !== null && !alDia;
  const marcado = resultados.length ? Math.min(cursor, resultados.length - 1) : -1;

  useEffect(() => () => clearTimeout(cierreRef.current), []);

  useEffect(() => {
    if (consultaActiva === null) return undefined;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      searchPlaces(consultaActiva, { signal: ctrl.signal })
        .then((items) => setDatos({ q: consultaActiva, items, fallo: false }))
        .catch((err) => {
          if (err.name === 'AbortError') return;
          setDatos({ q: consultaActiva, items: [], fallo: true });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [consultaActiva]);

  const salirDeEdicion = () => {
    setConsulta(null);
    setAbierto(false);
    setCursor(0);
  };

  const elegir = (place) => {
    salirDeEdicion();
    inputRef.current?.blur();
    onSelect?.(place);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      salirDeEdicion();
      inputRef.current?.blur();
      return;
    }
    if (!resultados.length) {
      if (e.key === 'Enter') e.preventDefault();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((marcado + 1) % resultados.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(marcado <= 0 ? resultados.length - 1 : marcado - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      elegir(resultados[Math.max(marcado, 0)]);
    }
  };

  const mostrarPanel = abierto && consultaActiva !== null;
  const enPantalla = editando ? consulta : (loading ? 'Buscando dirección…' : value);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        className="field"
        style={{ width: '100%', boxShadow: 'var(--shadow-lg)', padding: '12px 14px', gap: 10 }}
      >
        <Ic n="search" size={17} style={{ color: 'var(--ink-soft)' }} />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={mostrarPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          value={enPantalla}
          placeholder={placeholder}
          onChange={(e) => {
            setConsulta(e.target.value);
            setAbierto(true);
            setCursor(0);
          }}
          onFocus={(e) => {
            clearTimeout(cierreRef.current);
            // El panel no se abre al enfocar: todavía no hay consulta, solo el
            // lugar ya elegido. Se selecciona todo para que tipear lo pise.
            e.target.select();
          }}
          onBlur={() => { cierreRef.current = setTimeout(salirDeEdicion, CIERRE_MS); }}
          onKeyDown={onKeyDown}
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            flex: 1, minWidth: 0, textOverflow: 'ellipsis',
            fontSize: 15, fontFamily: 'var(--sans)', color: 'var(--ink)',
          }}
        />
        {enPantalla && (
          <button
            title="Borrar"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setConsulta('');
              setAbierto(true);
              setCursor(0);
              inputRef.current?.focus();
            }}
            style={{
              border: 'none', background: 'none', cursor: 'pointer', flex: 'none',
              color: 'var(--ink-faint)', padding: 0, display: 'flex',
            }}
          >
            <Ic n="close" size={16} />
          </button>
        )}
        {onReset && (
          <button
            title={resetLabel}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              salirDeEdicion();
              onReset();
            }}
            style={{
              border: 'none', background: 'none', cursor: 'pointer', flex: 'none',
              color: 'var(--ink-soft)', font: 'inherit', fontSize: 13,
              padding: '0 0 0 10px', borderLeft: '1px solid var(--line)', whiteSpace: 'nowrap',
            }}
          >
            {resetLabel}
          </button>
        )}
      </div>

      {mostrarPanel && (
        <div
          id={listId}
          role="listbox"
          className="card"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
            boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 1001,
          }}
        >
          {resultados.map((p, i) => (
            <button
              key={p.id}
              role="option"
              aria-selected={i === marcado}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setCursor(i)}
              onClick={() => elegir(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                font: 'inherit', color: 'var(--ink)',
                background: i === marcado ? 'var(--surface-2)' : 'none',
                borderBottom: i === resultados.length - 1 ? 'none' : '1px solid var(--line)',
              }}
            >
              <Ic n="pin" size={15} style={{ color: 'var(--ink-soft)' }} />
              <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.titulo}
                </span>
                {p.detalle && (
                  <span className="helper" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.detalle}
                  </span>
                )}
              </span>
            </button>
          ))}

          {!resultados.length && (
            <div className="helper" style={{ padding: '12px 14px' }}>
              {buscando
                ? 'Buscando lugares…'
                : fallo
                  ? 'No pudimos consultar el buscador de lugares. Probá de nuevo.'
                  : `No encontramos nada para “${q}”.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
