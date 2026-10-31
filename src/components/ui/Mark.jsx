export function Mark({ s = 24, stroke = '#211f1c', fill = '#bd5d3a', sw = 8 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none" style={{ display: 'block' }}>
      <rect x="14" y="14" width="72" height="72" rx="17" stroke={stroke} strokeWidth={sw} />
      <rect x="49" y="49" width="23" height="23" rx="6" fill={fill} />
    </svg>
  );
}
