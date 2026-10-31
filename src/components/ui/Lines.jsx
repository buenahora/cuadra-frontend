export function Lines({ rows = 3, widths, color = 'var(--line)' }) {
  const ws = widths || Array.from({ length: rows }, (_, i) => 100 - i * 12 - (i % 2) * 8);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ws.map((w, i) => (
        <div key={i} style={{ height: 7, borderRadius: 6, background: color, width: w + '%', opacity: .9 }} />
      ))}
    </div>
  );
}
