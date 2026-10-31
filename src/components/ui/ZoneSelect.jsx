import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Ic } from './Ic';

// El click en una opción llega después del blur del input: el cierre se demora
// lo justo para que el onClick alcance a correr.
const CIERRE_MS = 150;

/* Selector de barrio con autocompletado.
 *
 * Se escribe para filtrar (a diferencia de un <select>, que obliga a recorrer
 * 40+ barrios) y la lista siempre se puede desplegar completa. `value` es el id
 * del barrio elegido; mientras no se esté tipeando el input muestra su nombre.
 */
export function ZoneSelect({ zones = [], value, onChange, placeholder = 'Escribí un barrio' }) {
  // null = no se está editando, se muestra el barrio elegido. Un string es lo tipeado.
  const [consulta, setConsulta] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [cursor, setCursor] = useState(0);

  const inputRef = useRef(null);
  const cierreRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  const elegida = zones.find((z) => z.id === value) ?? null;
  const editando = consulta !== null;
  const q = editando ? consulta.trim().toLowerCase() : '';

  const opciones = useMemo(
    () => (q ? zones.filter((z) => z.nombre.toLowerCase().includes(q)) : zones),
    [zones, q]
  );
  const marcado = opciones.length ? Math.min(cursor, opciones.length - 1) : -1;

  useEffect(() => () => clearTimeout(cierreRef.current), []);

  // La opción marcada con el teclado tiene que quedar a la vista.
  useEffect(() => {
    if (!abierto || marcado < 0) return;
    listRef.current?.children[marcado]?.scrollIntoView({ block: 'nearest' });
  }, [abierto, marcado]);

  // Al desplegar la lista completa conviene arrancar sobre el barrio elegido:
  // con 40+ barrios, abrir arriba de todo esconde el que está en uso.
  const abrir = () => {
    setAbierto(true);
    setCursor(Math.max(0, zones.findIndex((z) => z.id === value)));
  };

  const salirDeEdicion = () => {
    setConsulta(null);
    setAbierto(false);
    setCursor(0);
  };

  const elegir = (zone) => {
    salirDeEdicion();
    inputRef.current?.blur();
    onChange?.(zone.id);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      salirDeEdicion();
      inputRef.current?.blur();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!abierto) { abrir(); return; }
      if (!opciones.length) return;
      setCursor(e.key === 'ArrowDown'
        ? (marcado + 1) % opciones.length
        : (marcado <= 0 ? opciones.length - 1 : marcado - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (abierto && opciones.length) elegir(opciones[Math.max(marcado, 0)]);
    }
  };

  const enPantalla = editando ? consulta : (elegida?.nombre ?? '');

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div className={'field' + (abierto ? ' field--focus' : '')} style={{ width: '100%' }}>
        <Ic n="pin" size={16} />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={abierto}
          aria-controls={listId}
          aria-autocomplete="list"
          value={enPantalla}
          placeholder={zones.length ? placeholder : 'Cargando barrios…'}
          disabled={!zones.length}
          onChange={(e) => { setConsulta(e.target.value); setAbierto(true); setCursor(0); }}
          onFocus={(e) => {
            clearTimeout(cierreRef.current);
            abrir();
            // Se selecciona todo para que tipear pise el barrio elegido.
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
        <button
          title={abierto ? 'Cerrar' : 'Ver todos los barrios'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (abierto) { salirDeEdicion(); return; }
            abrir();
            inputRef.current?.focus();
          }}
          style={{
            border: 'none', background: 'none', cursor: 'pointer', flex: 'none',
            color: 'var(--ink-soft)', padding: 0, display: 'flex',
            transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .14s',
          }}
        >
          <Ic n="caretD" size={16} />
        </button>
      </div>

      {abierto && (
        <div
          id={listId}
          role="listbox"
          ref={listRef}
          className="card"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
            boxShadow: 'var(--shadow-lg)', overflowY: 'auto', maxHeight: 288, zIndex: 1001,
          }}
        >
          {opciones.length === 0 && (
            <p className="helper" style={{ margin: 0, padding: '12px 16px' }}>
              Ningún barrio coincide con “{consulta}”.
            </p>
          )}
          {opciones.map((z, i) => (
            <button
              key={z.id}
              role="option"
              aria-selected={z.id === value}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setCursor(i)}
              onClick={() => elegir(z)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '11px 16px', border: 'none', cursor: 'pointer',
                textAlign: 'left', font: 'inherit', borderBottom: '1px solid var(--line)',
                background: i === marcado ? 'var(--surface-2)' : 'none',
                color: z.id === value ? 'var(--clay-deep)' : 'var(--ink)',
                fontWeight: z.id === value ? 600 : 400,
                fontSize: 14.5,
              }}
            >
              <Ic n="pin" size={15} />
              {z.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
