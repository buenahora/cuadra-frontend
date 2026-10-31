const PATHS = {
  search:   '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  draw:     '<path d="M4 20h16"/><path d="M14.5 4.5l3 3L8 17l-4 1 1-4z"/>',
  locate:   '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
  bed:      '<path d="M3 18v-6h13a4 4 0 0 1 4 4v2"/><path d="M3 18V8M3 12h6v-2a2 2 0 0 1 2-2h0"/><path d="M21 18v-2"/>',
  bath:     '<path d="M4 12V6a2 2 0 0 1 4 0"/><path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M6 19l-1 2M18 19l1 2"/>',
  ruler:    '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
  pin:      '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/>',
  floors:   '<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-5h6v5"/>',
  phone:    '<path d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5V18a2 2 0 0 1-2 2A15 15 0 0 1 5 6a2 2 0 0 1 0-2z"/>',
  bookmark: '<path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.3-6.5 4.3v-16a1 1 0 0 1 1-1z"/>',
  send:     '<path d="M4 12l16-7-7 16-2.5-6.5z"/><path d="M10.5 14.5L20 5"/>',
  check:    '<path d="M5 12.5l4.5 4.5L19 7"/>',
  left:     '<path d="M14 6l-6 6 6 6"/>',
  right:    '<path d="M10 6l6 6-6 6"/>',
  caretD:   '<path d="M6 9l6 6 6-6"/>',
  plus:     '<path d="M12 5v14M5 12h14"/>',
  minus:    '<path d="M5 12h14"/>',
  filter:   '<path d="M4 6h16M7 12h10M10 18h4"/>',
  sort:     '<path d="M7 5v14M7 19l-3-3M7 5l3 3M17 19V5M17 5l3 3M17 19l-3-3"/>',
  cal:      '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>',
  download: '<path d="M12 4v11M8 11l4 4 4-4M5 19h14"/>',
  mail:     '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  info:     '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  close:    '<path d="M6 6l12 12M18 6L6 18"/>',
  sliders:  '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  image:    '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/>',
  dollar:   '<path d="M12 3v18M16 7.5C16 5.6 14.2 4 12 4S8 5.6 8 7.5 9.8 11 12 11s4 1.6 4 3.5S14.2 18 12 18s-4-1.6-4-3.5"/>',
  doc:      '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
  walk:     '<circle cx="13" cy="4.5" r="1.6"/><path d="M11 9l3-1 2 3 2 1M11 9l-1 5 2 1 1 5M10 14l-2 6"/>',
  star:     '<path d="M12 4l2.3 4.8 5.2.7-3.8 3.6.9 5.1-4.6-2.5-4.6 2.5.9-5.1L4.5 9.5l5.2-.7z"/>',
  chat:     '<path d="M4 5h16v11H9l-4 3v-3H4z"/>',
  lock:     '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  user:     '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5"/>',
  arrow:    '<path d="M5 12h14M13 6l6 6-6 6"/>',
  home:     '<path d="M4 11l8-6.5 8 6.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
  eye:      '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:   '<path d="M3 3l18 18"/><path d="M10.6 5.2A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a16.3 16.3 0 0 1-3.9 4.7M6.6 6.6C3.7 8.5 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  // Amenities (ficha del aviso, S1C) -- claves = amenity_id del catálogo
  // (backend/app/repositories/memory/seed.py AMENITIES).
  cochera:             '<path d="M5 16l1.5-5A2 2 0 0 1 8.4 9.5h7.2A2 2 0 0 1 17.5 11L19 16"/><path d="M4 16h16v3H4z"/><circle cx="8" cy="19" r="1.3"/><circle cx="16" cy="19" r="1.3"/>',
  balcon_terraza:      '<circle cx="12" cy="7" r="2.5"/><path d="M4 21V13h16v8"/><path d="M4 17h16"/>',
  ascensor:            '<rect x="7" y="3" width="10" height="18" rx="1.5"/><path d="M10 10l2-2 2 2M10 14l2 2 2-2"/>',
  aire_acondicionado:  '<rect x="3" y="6" width="18" height="7" rx="1.5"/><path d="M7 16l-1.5 3M12 16v3M17 16l1.5 3"/>',
  placares_empotrados: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 3v18"/><path d="M9 11v2M15 11v2"/>',
  parrillero:          '<ellipse cx="12" cy="9" rx="8" ry="3"/><path d="M4 9v2a8 3 0 0 0 16 0V9"/><path d="M8 16l-2 5M16 16l2 5"/>',
  piscina:             '<path d="M8 9V4l4 3 4-3v5"/><path d="M3 15c1.4-1.3 2.8-1.3 4.2 0 1.4 1.3 2.8 1.3 4.2 0 1.4-1.3 2.8-1.3 4.2 0 1.4 1.3 2.8 1.3 4.2 0"/><path d="M3 20c1.4-1.3 2.8-1.3 4.2 0 1.4 1.3 2.8 1.3 4.2 0 1.4-1.3 2.8-1.3 4.2 0 1.4 1.3 2.8 1.3 4.2 0"/>',
  gimnasio:            '<path d="M6 12h12"/><rect x="3" y="9" width="3" height="6" rx="1"/><rect x="18" y="9" width="3" height="6" rx="1"/><path d="M6 10v4M18 10v4"/>',
  porteria_24hs:       '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  calefaccion:         '<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M8 5v14M12 5v14M16 5v14"/>',
  lavadero:            '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M8 6h.01M11 6h.01"/>',
  seguridad_camaras:   '<rect x="3" y="9" width="11" height="7" rx="1.5"/><path d="M14 11l6-3v10l-6-3"/>',
};

export function Ic({ n, size = 18, sw = 1.7, style }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flex: 'none', ...style }}
      dangerouslySetInnerHTML={{ __html: PATHS[n] || '' }}
    />
  );
}
