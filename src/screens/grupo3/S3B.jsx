import { useState } from 'react';
import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { Photo } from '../../components/ui/Photo';
import { Btn } from '../../components/ui/Btn';
import { Ic } from '../../components/ui/Ic';
import { photo } from '../../data/photos';

const ALL_PROPS = [
  { t: 'Av. Brasil 2675',    tip: '1 dorm · 44 m²', p: '$21.000', st: 'Alquilada',  prop: 'C. Suárez',  venc: 'vence 03/27' },
  { t: 'Bvar. España 2140',  tip: '2 dorm · 62 m²', p: '$28.500', st: 'Disponible', prop: 'J. Methol',  venc: '—' },
  { t: 'Ellauri 470',        tip: '1 dorm · 40 m²', p: '$19.000', st: 'En proceso', prop: 'R. Píriz',   venc: '—' },
];

const stClass = (st) => st === 'Alquilada' ? 'status--on' : st === 'Disponible' ? 'status--mid' : 'status--off';

const FILTERS = ['Todas', 'Alquiladas', 'Disponibles', 'En proceso'];

export function S3B() {
  const { go } = useNav();
  const [filter, setFilter] = useState('Todas');

  const props = filter === 'Todas'
    ? ALL_PROPS
    : ALL_PROPS.filter(r => {
        if (filter === 'Alquiladas')  return r.st === 'Alquilada';
        if (filter === 'Disponibles') return r.st === 'Disponible';
        if (filter === 'En proceso')  return r.st === 'En proceso';
        return true;
      });

  return (
    <Screen active="analisis">
      <div className="body scroll-y">
        <div className="pad" style={{ maxWidth: 1040, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 className="h1">Mi cartera · 20 propiedades</h1>
            <div className="field" style={{ width: 280 }}>
              <Ic n="search" size={16} /><span className="ph">Buscar por dirección o propietario</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
            {FILTERS.map(f => (
              <Btn key={f} sm variant={filter === f ? 'primary' : 'ghost'} onClick={() => setFilter(f)}>{f}</Btn>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 14, marginTop: 22 }}>
            {props.map((r, i) => (
              <div key={r.t} className="card" style={{ display: 'flex', gap: 18, alignItems: 'center', padding: 16 }}>
                <Photo w={110} h={76} src={photo(i * 3 + 2)} style={{ borderRadius: 'var(--r-sm)' }} />
                <div style={{ flex: 1 }}>
                  <h3 className="h3" style={{ fontSize: 17 }}>{r.t}</h3>
                  <span className="helper" style={{ display: 'block', marginTop: 5 }}>{r.tip} · {r.prop} · {r.venc}</span>
                </div>
                <span className="price" style={{ fontSize: 17 }}>{r.p}</span>
                <span className={'status ' + stClass(r.st)}><span className="sd" />{r.st}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Btn sm onClick={() => go('1C')}>Ver aviso</Btn>
                  <Btn sm variant="ghost" onClick={() => go('3A')}>Analizar zona</Btn>
                </div>
              </div>
            ))}
            {props.length === 0 && (
              <p className="lbl" style={{ textAlign: 'center', padding: '32px 0' }}>No hay propiedades con ese estado.</p>
            )}
          </div>
        </div>
      </div>
    </Screen>
  );
}
