import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { destinationPoint, haversineMeters } from '../../lib/geo';

// Un "line" de scroll ~= 16px; Firefox reporta deltaMode 1 en vez de píxeles.
const LINE_HEIGHT_PX = 16;
// ~90px de pinch acumulado = 1 nivel de zoom.
const PINCH_PX_PER_ZOOM = 90;
// El pinch dispara decenas de eventos por segundo: se acumulan y se aplica un
// zoom solo, si no el mapa se resetea en cada evento y las tiles parpadean.
const ZOOM_DEBOUNCE_MS = 45;

const CLAY = '#bd5d3a';
const HOME = '<path d="M4 11l8-6.5 8 6.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>';

function priceIcon(price, active) {
  const svg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${HOME}</svg>`;
  return L.divIcon({
    html: `<div class="mapmark${active ? ' mapmark--on' : ''}" style="position:relative;transform:none">${svg} ${price}</div>`,
    className: '',
    iconAnchor: [55, 44],
  });
}

function locationPinIcon(label) {
  const lab = label
    ? `<span style="margin-top:8px;font-size:12px;font-weight:500;color:#211f1c;background:#fff;border:1px solid #e3ddcf;border-radius:30px;padding:3px 10px;white-space:nowrap;box-shadow:0 2px 8px rgba(33,31,28,.08)">${label}</span>`
    : '';
  return L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center">
        <div style="
          width:28px;height:28px;
          background:${CLAY};
          border:3px solid #fff;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 4px 14px rgba(33,31,28,.18);
          display:flex;align-items:center;justify-content:center;
        ">
          <div style="width:7px;height:7px;border-radius:50%;background:#fff;transform:rotate(45deg)"></div>
        </div>
        ${lab}
      </div>`,
    className: '',
    iconAnchor: [14, 32],
  });
}

// Manijo de vértice del polígono dibujado a mano (1B).
function vertexIcon() {
  return L.divIcon({
    html: `<div style="width:15px;height:15px;border-radius:50%;background:#fff;border:2.5px solid ${CLAY};box-shadow:0 2px 6px rgba(33,31,28,.22)"></div>`,
    className: '',
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5],
  });
}

// Manijo de radio sobre el borde del círculo (1E).
function radiusIcon() {
  return L.divIcon({
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${CLAY};border:3px solid #fff;box-shadow:0 2px 8px rgba(33,31,28,.28)"></div>`,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// Los handlers que no deben re-crear capas viven en refs: así el efecto que
// dibuja depende solo de la geometría y no de la identidad de las funciones.
function useLatest(value) {
  const ref = useRef(value);
  // El efecto corre antes que los de dibujo (se declara antes en el cuerpo del
  // componente), así que las capas siempre leen el valor de este render.
  useEffect(() => { ref.current = value; });
  return ref;
}

/* Mapa base.
 *
 * - `interactive={false}` congela el mapa (1C: solo ubicar el aviso).
 * - `polygon` + `onPolygonChange` habilitan la zona dibujada a mano (1B):
 *   vértices arrastrables, click en un vértice lo borra.
 * - `circle` + `onCircleChange` habilitan centro + radio arrastrables (1E).
 * - `onMapClick` recibe {lat,lng} de cada click en el mapa.
 */
export function MapView({
  center,
  zoom = 14,
  bounds = null,
  markers = [],
  onMarkerClick,
  style,
  interactive = true,
  polygon = null,
  onPolygonChange = null,
  circle = null,
  onCircleChange = null,
  onMapClick = null,
  cursor,
}) {
  const containerRef    = useRef(null);
  const mapRef          = useRef(null);
  const markersLayerRef = useRef(null);
  const shapeLayerRef   = useRef(null);

  const onMarkerClickRef   = useLatest(onMarkerClick);
  const onMapClickRef      = useLatest(onMapClick);
  const onPolygonChangeRef = useLatest(onPolygonChange);
  const onCircleChangeRef  = useLatest(onCircleChange);
  const polygonRef         = useLatest(polygon);
  const circleRef          = useLatest(circle);
  const interactiveRef     = useLatest(interactive);

  // Claves serializadas: los arrays llegan re-creados en cada render, así que
  // sin esto las capas se reconstruirían todo el tiempo (y los marcadores
  // parpadearían mientras se arrastra).
  const markersKey = useMemo(
    () => markers.map((m) => `${m.pos[0]},${m.pos[1]},${m.price ?? ''},${m.label ?? ''},${m.active ? 1 : 0}`).join(';'),
    [markers],
  );
  const markersRef = useLatest(markers);
  const polygonKey = polygon ? polygon.map((p) => p.join(',')).join(';') : '';
  const circleKey = circle ? `${circle.center[0]},${circle.center[1]},${Math.round(circle.radius)}` : '';
  const boundsKey = bounds ? bounds.map((p) => p.join(',')).join(';') : '';
  const centerLat = center?.[0];
  const centerLng = center?.[1];
  const editable = !!onPolygonChange;
  const circleEditable = !!onCircleChange;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
      // El wheel lo manejamos nosotros (ver onWheel): en trackpad el gesto de
      // dos dedos tiene que desplazar el mapa, no hacer zoom.
      scrollWheelZoom: false,
      // Mapa "de ficha": ni arrastre ni zoom, solo ubica el aviso.
      dragging: interactive,
      touchZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    shapeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on('click', (e) => {
      if (!interactiveRef.current) return;
      onMapClickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    /* Gestos de trackpad
     * - dos dedos (scroll vertical, lateral o diagonal) -> desplaza el mapa
     * - pinch -> zoom sobre el cursor. macOS/Windows mandan el pinch como un
     *   wheel con ctrlKey aunque no haya ninguna tecla apretada; ctrl/cmd +
     *   rueda de mouse cae en el mismo camino y también hace zoom.
     */
    let zoomAccum = 0;
    let zoomPoint = null;
    let zoomTimer = null;

    const applyZoom = () => {
      zoomTimer = null;
      const target = Math.max(
        map.getMinZoom(),
        Math.min(map.getMaxZoom(), Math.round(map.getZoom() - zoomAccum / PINCH_PX_PER_ZOOM)),
      );
      // Si el gesto todavía no da para un nivel entero no reseteamos el
      // acumulado: el pinch lento sigue sumando hasta que salta.
      if (target === map.getZoom()) return;
      zoomAccum = 0;
      map.setZoomAround(zoomPoint, target); // animado: Leaflet escala las tiles que ya tiene
    };

    const onWheel = (e) => {
      // Mapa congelado: la rueda tiene que scrollear la página, no el mapa.
      if (!interactiveRef.current) return;
      e.preventDefault();
      // deltaMode: 0 px, 1 líneas, 2 páginas.
      const unit = e.deltaMode === 1 ? LINE_HEIGHT_PX : e.deltaMode === 2 ? el.clientHeight : 1;
      const dx = e.deltaX * unit;
      const dy = e.deltaY * unit;

      if (e.ctrlKey || e.metaKey) {
        zoomAccum += dy;
        zoomPoint = map.mouseEventToContainerPoint(e);
        if (!zoomTimer) zoomTimer = setTimeout(applyZoom, ZOOM_DEBOUNCE_MS);
        return;
      }

      if (dx || dy) map.panBy([dx, dy], { animate: false });
    };

    // passive:false porque hace falta preventDefault para no scrollear la página.
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      clearTimeout(zoomTimer);
      el.removeEventListener('wheel', onWheel);
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      shapeLayerRef.current = null;
    };
  }, []);

  // interactive puede cambiar en caliente (1B alterna dibujar/mover).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handlers = ['dragging', 'touchZoom', 'doubleClickZoom', 'boxZoom', 'keyboard'];
    handlers.forEach((h) => {
      if (!map[h]) return;
      if (interactive) map[h].enable();
      else map[h].disable();
    });
  }, [interactive]);

  // Recentrar cuando cambia el aviso/punto de referencia, sin pelearle al
  // usuario los paneos que ya hizo (solo si el centro pedido cambió).
  // Si hay `bounds`, ese encuadre manda: lo resuelve el efecto de abajo.
  const lastCenterRef = useRef(center);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center || bounds) return;
    const [lat, lng] = center;
    const [pLat, pLng] = lastCenterRef.current || [];
    if (lat === pLat && lng === pLng) return;
    lastCenterRef.current = center;
    map.setView(center, zoom, { animate: false });
  }, [centerLat, centerLng, !!bounds]);

  // Encuadra el mapa a una caja (ej. límites de un barrio) en vez de un
  // center/zoom fijo: más preciso que estimar un zoom a mano por zona.
  //
  // Al montar, el contenedor puede no tener medidas todavía (0x0): Leaflet
  // calcula el zoom del fitBounds dividiendo por el tamaño del contenedor, y
  // con 0x0 esa cuenta da NaN (mapa roto, "no carga bien"). invalidateSize()
  // fuerza a Leaflet a remedir; si aun así da 0 (layout todavía no corrió),
  // se reintenta en el próximo frame en vez de aplicar un fitBounds inválido.
  //
  // Sin ref de "ya aplicado": con StrictMode, el efecto monta/desmonta/monta
  // una vez en desarrollo, y una ref así sobrevive al primer montaje
  // descartado -- el segundo (el mapa que queda visible) se lo saltearía
  // pensando que el fit ya estaba hecho. El array de dependencias ya evita
  // reaplicar de más cuando `bounds` no cambió.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bounds) return;

    let cancelled = false;
    const applyFit = () => {
      if (cancelled) return;
      map.invalidateSize({ animate: false });
      const size = map.getSize();
      if (size.x === 0 || size.y === 0) {
        requestAnimationFrame(applyFit);
        return;
      }
      map.fitBounds(bounds, { animate: false, padding: [24, 24] });
    };
    applyFit();
    return () => { cancelled = true; };
  }, [boundsKey]);

  // Los markers suelen llegar después de una llamada async a la API,
  // así que se re-renderizan en un effect aparte en vez de solo al montar.
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    markersRef.current.forEach((marker) => {
      const { pos, price, active, label } = marker;
      const icon = price ? priceIcon(price, active) : locationPinIcon(label);
      L.marker(pos, { icon, interactive: interactiveRef.current, keyboard: false })
        .addTo(layer)
        .on('click', () => onMarkerClickRef.current?.(marker));
    });
  }, [markersKey, interactive]);

  // Polígono (zona dibujada) + círculo (radio) comparten capa: los dos se
  // redibujan cuando cambia la geometría, incluido el commit de un arrastre.
  useEffect(() => {
    const map = mapRef.current;
    const layer = shapeLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const ring = polygonRef.current || [];
    if (ring.length >= 2) {
      // interactive:false en el trazo: el click tiene que llegar al mapa para
      // poder seguir agregando vértices con la zona ya dibujada encima.
      const shape = ring.length >= 3
        ? L.polygon(ring, { color: CLAY, weight: 2.5, dashArray: '7 5', fillColor: CLAY, fillOpacity: 0.14, interactive: false })
        : L.polyline(ring, { color: CLAY, weight: 2.5, dashArray: '7 5', interactive: false });
      shape.addTo(layer);
    }

    if (ring.length) {
      ring.forEach((pos, i) => {
        const handle = L.marker(pos, {
          icon: vertexIcon(),
          draggable: editable,
          interactive: editable,
          keyboard: false,
        }).addTo(layer);
        if (!editable) return;
        handle.on('drag', (e) => {
          const { lat, lng } = e.target.getLatLng();
          const preview = polygonRef.current.map((p, k) => (k === i ? [lat, lng] : p));
          layer.eachLayer((l) => {
            if (l instanceof L.Polygon || l instanceof L.Polyline) l.setLatLngs(preview);
          });
        });
        handle.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          onPolygonChangeRef.current?.(polygonRef.current.map((p, k) => (k === i ? [lat, lng] : p)));
        });
        // Click (sin arrastre) borra el vértice. Leaflet ya no dispara click
        // después de un drag (Map._draggableMoved), así que no hace falta
        // distinguir los dos gestos a mano.
        handle.on('click', () => {
          onPolygonChangeRef.current?.(polygonRef.current.filter((_, k) => k !== i));
        });
      });
    }

    const c = circleRef.current;
    if (c) {
      const circleLayer = L.circle(c.center, {
        radius: c.radius,
        color: CLAY,
        weight: 2,
        dashArray: '6 5',
        fillColor: CLAY,
        fillOpacity: 0.1,
        interactive: false,
      }).addTo(layer);

      const centerMarker = L.marker(c.center, {
        icon: locationPinIcon(c.label),
        draggable: circleEditable,
        interactive: circleEditable,
        keyboard: false,
        zIndexOffset: 400,
      }).addTo(layer);

      // El manijo va al este del centro: es el borde que queda siempre libre
      // de la etiqueta del pin.
      const handleLatLng = destinationPoint(c.center[0], c.center[1], c.radius, 90);
      const radiusHandle = circleEditable
        ? L.marker(handleLatLng, { icon: radiusIcon(), draggable: true, keyboard: false, zIndexOffset: 500 }).addTo(layer)
        : null;

      if (circleEditable) {
        centerMarker.on('drag', (e) => {
          const { lat, lng } = e.target.getLatLng();
          circleLayer.setLatLng([lat, lng]);
          radiusHandle?.setLatLng(destinationPoint(lat, lng, circleLayer.getRadius(), 90));
        });
        centerMarker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          onCircleChangeRef.current?.({ center: [lat, lng], radius: circleLayer.getRadius() });
        });

        radiusHandle.on('drag', (e) => {
          const { lat, lng } = e.target.getLatLng();
          const [cLat, cLng] = circleLayer.getLatLng() ? [circleLayer.getLatLng().lat, circleLayer.getLatLng().lng] : c.center;
          const r = Math.max(150, Math.min(15000, haversineMeters(cLat, cLng, lat, lng)));
          circleLayer.setRadius(r);
        });
        radiusHandle.on('dragend', () => {
          const { lat, lng } = circleLayer.getLatLng();
          onCircleChangeRef.current?.({ center: [lat, lng], radius: circleLayer.getRadius() });
        });
      }
    }
  }, [polygonKey, circleKey, editable, circleEditable, circle?.label]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', ...(cursor ? { cursor } : null), ...style }} />
  );
}
