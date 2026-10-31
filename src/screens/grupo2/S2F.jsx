import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { Photo } from '../../components/ui/Photo';
import { Btn } from '../../components/ui/Btn';
import { photo } from '../../data/photos';

const ROWS = [
  { t: 'Monoambiente en el Cordón',   p: '$18.000', st: 'Activo',  q: 3, d: '12 may' },
  { t: '1 dorm en Pocitos',           p: '$21.000', st: 'Activo',  q: 1, d: '02 jun' },
  { t: '2 dorm en La Blanqueada',     p: '$26.500', st: 'Pausado', q: 0, d: '28 abr' },
];

export function S2F() {
  const { go } = useNav();
  return (
    <Screen active="avisos">
      <div className="body scroll-y">
        <div className="pad" style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 className="h1">Mis publicaciones</h1>
            <Btn variant="primary" icon="plus" onClick={() => go('2A')}>Publicar nuevo</Btn>
          </div>
          <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
            {ROWS.map((r, i) => (
              <div
                key={i}
                className="card"
                onClick={() => go('1C')}
                style={{ display: 'flex', gap: 18, alignItems: 'center', padding: 16, cursor: 'pointer', transition: 'box-shadow .15s, border-color .15s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.borderColor = 'var(--border-2)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}
              >
                <Photo w={120} h={84} src={photo(i * 4)} style={{ borderRadius: 'var(--r-sm)' }} />
                <div style={{ flex: 1 }}>
                  <h3 className="h3" style={{ fontSize: 17 }}>{r.t}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 9 }}>
                    <span className="price" style={{ fontSize: 17 }}>{r.p}</span>
                    <span className="tag-note">{r.d}</span>
                    <span className={'status ' + (r.st === 'Activo' ? 'status--on' : 'status--off')}>
                      <span className="sd" />{r.st}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingRight: 6 }}>
                  <span className="badge">{r.q}</span>
                  <span className="helper">consultas</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} onClick={e => e.stopPropagation()}>
                  <Btn sm icon="mail" onClick={() => go('2G')}>Ver consultas</Btn>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn sm>Editar</Btn>
                    <Btn sm variant="ghost">{r.st === 'Pausado' ? 'Activar' : 'Pausar'}</Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}
