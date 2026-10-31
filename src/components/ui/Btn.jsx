import { Ic } from './Ic';

export function Btn({ children, variant, sm, block, icon, iconR, disabled, onClick, style }) {
  const cls = ['btn'];
  if (variant === 'primary') cls.push('btn--primary');
  if (variant === 'dark')    cls.push('btn--dark');
  if (variant === 'ghost')   cls.push('btn--ghost');
  if (variant === 'saved')   cls.push('btn--saved');
  if (sm)    cls.push('btn--sm');
  if (block) cls.push('btn--block');
  return (
    <button className={cls.join(' ')} disabled={disabled} onClick={onClick} style={style}>
      {icon  && <Ic n={icon}  size={sm ? 15 : 16} />}
      {children}
      {iconR && <Ic n={iconR} size={sm ? 15 : 16} />}
    </button>
  );
}
