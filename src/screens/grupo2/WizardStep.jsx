import { Screen } from '../../components/Screen';
import { Btn } from '../../components/ui/Btn';
import { Steps } from '../../components/ui/Steps';

const STEP_LABELS = ['Ubicación', 'Características', 'Precio', 'Fotos'];

export function WizardStep({ step, children, onBack, onNext, nextLabel = 'Siguiente' }) {
  return (
    <Screen active="publicar">
      <div className="body scroll-y">
        <div className="pad" style={{ maxWidth: 880, margin: '0 auto', width: '100%', paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <span className="kicker" style={{ whiteSpace: 'nowrap' }}>Paso {step} de 4 · {STEP_LABELS[step - 1]}</span>
            <div className="pbar" style={{ width: 280 }}>
              <div className="fill" style={{ width: step * 25 + '%' }} />
            </div>
            <span />
          </div>
          <div style={{ margin: '18px 0 44px' }}>
            <Steps step={step} labels={STEP_LABELS} />
          </div>
          {children}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 30 }}>
            <Btn variant="ghost" icon="left" onClick={onBack}>{step === 1 ? 'Cancelar' : 'Atrás'}</Btn>
            <div style={{ flex: 1 }} />
            <Btn variant="primary" iconR="right" onClick={onNext}>{nextLabel}</Btn>
          </div>
        </div>
      </div>
    </Screen>
  );
}
