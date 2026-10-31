import { useState } from 'react';
import { useNav } from '../../context/NavContext';
import { WizardStep } from './WizardStep';
import { Field } from '../../components/ui/Field';
import { Photo } from '../../components/ui/Photo';
import { Ic } from '../../components/ui/Ic';
import { photo } from '../../data/photos';

const MAX_PHOTOS = 10;
const MIN_PHOTOS = 3;

const textareaStyle = {
  border: 'none', outline: 'none', background: 'transparent', resize: 'none',
  width: '100%', height: '100%', fontSize: 15, fontFamily: 'var(--sans)',
  color: 'var(--ink)', lineHeight: 1.55,
};

export function S2E() {
  const { go, toast } = useNav();
  // Track which preset photos are included and any "added" slots
  const [included, setIncluded] = useState([true, true, true]);
  const [extras, setExtras]     = useState(0);
  const [desc, setDesc]         = useState('');
  const [desde, setDesde]       = useState('01 / 07 / 2026');
  const [hasta, setHasta]       = useState('');

  const totalPhotos = included.filter(Boolean).length + extras;

  const togglePhoto = (i) => {
    if (included[i] && totalPhotos <= MIN_PHOTOS) {
      toast(`Necesitás al menos ${MIN_PHOTOS} fotos`);
      return;
    }
    setIncluded(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const addPhoto = () => {
    if (totalPhotos >= MAX_PHOTOS) {
      toast('Máximo 10 fotos por aviso');
      return;
    }
    setExtras(n => n + 1);
    toast('Foto agregada');
  };

  // Build slots: 3 preset + extras + empty placeholders (up to 5 visible)
  const slots = [
    ...included.map((on, i) => ({ type: 'preset', i, on })),
    ...Array.from({ length: extras }, (_, i) => ({ type: 'extra', i })),
  ];
  const emptySlots = Math.max(0, 5 - slots.length);

  return (
    <WizardStep step={4} onBack={() => go('2D')} onNext={() => go('2E-ok')} nextLabel="Publicar aviso">

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className="lbl" style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>
            Fotos ({totalPhotos} / {MAX_PHOTOS} · mínimo {MIN_PHOTOS})
          </span>
          <span className="helper" style={{ fontSize: 12 }}>{totalPhotos < MIN_PHOTOS ? `Faltan ${MIN_PHOTOS - totalPhotos} fotos` : 'Listo ✓'}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {slots.map((s) => (
            <div key={s.type + s.i} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => s.type === 'preset' ? togglePhoto(s.i) : null}>
              <Photo
                h={96}
                src={photo(s.type === 'preset' ? s.i : s.i + 5)}
                style={{
                  borderRadius: 'var(--r-sm)',
                  opacity: s.type === 'preset' && !s.on ? 0.35 : 1,
                  transition: 'opacity .15s',
                }}
              />
              {(s.type !== 'preset' || s.on) && (
                <span style={{ position: 'absolute', top: 7, right: 7, width: 22, height: 22, borderRadius: '50%', background: 'var(--below)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic n="check" size={13} sw={2.4} />
                </span>
              )}
              {s.type === 'preset' && !s.on && (
                <span style={{ position: 'absolute', top: 7, right: 7, width: 22, height: 22, borderRadius: '50%', background: 'rgba(33,31,28,.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic n="close" size={12} />
                </span>
              )}
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={'empty' + i}
              onClick={addPhoto}
              style={{ height: 96, border: '1.5px dashed var(--border-2)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--ink-soft)', cursor: 'pointer', transition: 'border-color .14s, color .14s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--clay-tint)'; e.currentTarget.style.color = 'var(--clay-deep)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
            >
              <Ic n="plus" size={18} />
              <span style={{ fontSize: 12.5 }}>agregar</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <span className="lbl" style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>Descripción</span>
        <div className="field field--area" style={{ height: 110, marginTop: 7 }}>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Describí el apartamento: luminosidad, estado, servicios cercanos…"
            style={textareaStyle}
          />
        </div>
        <span className="helper" style={{ float: 'right', marginTop: 4 }}>{desc.length} / 500</span>
      </div>

      <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 580 }}>
        <Field label="Disponible desde" value={desde} onChange={setDesde} icon="cal" placeholder="DD / MM / AAAA" />
        <Field label="Disponible hasta (opcional)" value={hasta} onChange={setHasta} icon="cal" placeholder="Sin límite" />
      </div>

    </WizardStep>
  );
}
