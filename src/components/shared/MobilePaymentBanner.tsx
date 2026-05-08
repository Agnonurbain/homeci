import { KenteLine } from '../ui/KenteLine';

export default function MobilePaymentBanner() {
  return (
    <div className="mt-7 rounded-2xl overflow-hidden">
      <KenteLine />
      <div
        className="p-5 flex items-center gap-4 flex-wrap"
        style={{ background: 'linear-gradient(135deg,#0D1F12,#1A0E00)' }}
      >
        <span style={{ fontSize: 32 }}>💳</span>
        <div className="flex-1">
          <h3
            className="font-bold mb-1"
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '1.1rem',
              color: '#F5E6C8',
            }}
          >
            Paiements mobiles — Bientôt disponibles
          </h3>
          <p
            className="text-sm"
            style={{ color: 'rgba(245,230,200,0.55)', fontFamily: 'var(--font-nunito)' }}
          >
            Recevez cautions et loyers via Orange Money, MTN MoMo, Wave, Flooz, Djamo
          </p>
        </div>
      </div>
    </div>
  );
}
