import { useState, useEffect } from 'react';
import { useNav } from '../../context/NavContext';
import { Screen } from '../../components/Screen';
import { Photo } from '../../components/ui/Photo';
import { Field } from '../../components/ui/Field';
import { Btn } from '../../components/ui/Btn';
import { Ic } from '../../components/ui/Ic';
import { MarketChip } from '../../components/ui/MarketChip';
import { getListing } from '../../api/listings';
import { createInquiry } from '../../api/inquiries';
import { isAuthenticated } from '../../api/auth';
import { formatPrice, formatBeds, formatArea, marketLevel } from '../../lib/format';

export function S1D() {
  const { go, params } = useNav();
  const [listing, setListing] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaMudanza, setFechaMudanza] = useState('');
  const [mensaje, setMensaje] = useState('Hola, estoy interesado en el apartamento. ¿Cuándo podríamos coordinar una visita?');
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      go('LA', { redirect: '1D', ...(params.id ? { id: params.id } : {}) }, { replace: true });
    }
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    getListing(params.id)
      .then((l) => { if (!cancelled) setListing(l); })
      .catch((err) => { if (!cancelled) setLoadError(err); });
    return () => { cancelled = true; };
  }, [params.id]);

  if (!isAuthenticated()) {
    return null; // redirigiendo a login
  }

  const backTo = () => go(params.id ? '1C' : '1B', params.id ? { id: params.id } : undefined);

  const submit = async () => {
    if (submitting || !params.id) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await createInquiry(params.id, {
        nombre,
        email,
        telefono: telefono || undefined,
        fecha_mudanza: fechaMudanza || undefined,
        mensaje,
      });
      go('1D-ok');
    } catch {
      setSubmitError('No pudimos enviar tu consulta. Revisá los datos e intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen active="buscar">
      <div className="body scroll-y">
        <div className="pad" style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
          <a className="crumbs" style={{ marginBottom: 8 }} onClick={backTo}>
            <Ic n="left" size={15} /> Volver al aviso
          </a>
          <h1 className="h1" style={{ margin: '6px 0 20px' }}>Consultar por este apartamento</h1>

          {listing && (
            <div className="card" style={{ display: 'flex', gap: 14, padding: 12, alignItems: 'center', marginBottom: 24 }}>
              <Photo w={84} h={64} src={listing.fotos?.[0]?.url} style={{ borderRadius: 'var(--r-sm)' }} />
              <div>
                <div className="price" style={{ fontSize: 20 }}>
                  {formatPrice(listing.precio)}<span className="per" style={{ fontFamily: 'var(--sans)', fontWeight: 500 }}> /mes</span>
                </div>
                <span className="lbl" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Ic n="pin" size={14} /> {listing.zone?.nombre} · {formatBeds(listing.dormitorios)} · {formatArea(listing.metraje_m2)}
                </span>
              </div>
              <div style={{ marginLeft: 'auto' }}><MarketChip level={marketLevel(listing.market_position)} /></div>
            </div>
          )}
          {!params.id && <p className="helper" style={{ marginBottom: 24 }}>No se especificó un aviso para consultar.</p>}
          {loadError && <p className="helper" style={{ marginBottom: 24 }}>No pudimos cargar el aviso.</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <Field label="Nombre completo *" placeholder="Tu nombre" value={nombre} onChange={setNombre} />
            <Field label="Email *" placeholder="tu@correo.com" value={email} onChange={setEmail} />
            <Field label="Teléfono (opcional)" placeholder="09X XXX XXX" value={telefono} onChange={setTelefono} />
            <Field label="Fecha de mudanza (opcional)" placeholder="aaaa-mm-dd" icon="cal" value={fechaMudanza} onChange={setFechaMudanza} />
          </div>

          <div style={{ marginTop: 18 }}>
            <span className="lbl" style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>Mensaje</span>
            <div className="field field--area" style={{ height: 110, marginTop: 7 }}>
              <textarea
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', resize: 'none', width: '100%', height: '100%', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)' }}
              />
            </div>
          </div>

          {submitError && <p className="err-msg" style={{ marginTop: 14 }}>{submitError}</p>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24 }}>
            <Btn variant="ghost" onClick={backTo}>Cancelar</Btn>
            <div style={{ flex: 1 }} />
            <Btn variant="primary" icon="send" disabled={submitting || !params.id} onClick={submit}>
              {submitting ? 'Enviando…' : 'Enviar consulta'}
            </Btn>
          </div>
          <p className="helper" style={{ marginTop: 14 }}>El propietario recibirá tu mensaje y se pondrá en contacto.</p>
        </div>
      </div>
    </Screen>
  );
}
