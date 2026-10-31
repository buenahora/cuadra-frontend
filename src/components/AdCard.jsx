import { useNav } from '../context/NavContext';
import { photo } from '../data/photos';
import { Photo } from './ui/Photo';
import { MarketChip } from './ui/MarketChip';
import { Ic } from './ui/Ic';
import { useFavorites, toggleFavorite } from '../lib/favorites';

export function AdCard({
  price = '$18.000', level = 'below', beds = '1 dorm', area = '42 m²',
  zone = 'Cordón', dist, code = '1C', id, compact, img = 0, photoUrl, row,
}) {
  const { go, toast } = useNav();
  const favoritos = useFavorites();
  const guardado = id != null && favoritos.includes(id);

  const onFav = (e) => {
    e.stopPropagation(); // el card entero navega al detalle
    const agregado = toggleFavorite(id);
    toast(agregado ? 'Agregado a guardados' : 'Quitado de guardados');
  };

  return (
    <div className={'lcard' + (row ? ' lcard--row' : '')} onClick={() => go(code, id ? { id } : undefined)}>
      {id != null && (
        <button
          className={'favbtn' + (guardado ? ' favbtn--on' : '')}
          title={guardado ? 'Quitar de guardados' : 'Guardar para comparar'}
          aria-pressed={guardado}
          onClick={onFav}
        >
          <Ic n="bookmark" size={16} />
        </button>
      )}
      <Photo
        w={row ? 184 : '100%'}
        h={row ? '100%' : compact ? 124 : 190}
        src={photoUrl ?? photo(img)}
        style={row ? { flex: 'none' } : undefined}
      />
      <div className="body2">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span className="big-price" style={{ fontSize: compact ? 24 : 27 }}>
            {price}<span className="per"> /mes</span>
          </span>
        </div>
        <MarketChip level={level} />
        <div className="datarow">
          <span className="d"><Ic n="bed"   size={15} />{beds}</span>
          {area && <span className="d"><Ic n="ruler" size={15} />{area}</span>}
          <span className="d"><Ic n="pin"   size={15} />{zone}</span>
        </div>
        {dist && (
          <span className="dist"><Ic n="walk" size={14} /> a {dist} caminando</span>
        )}
      </div>
    </div>
  );
}
