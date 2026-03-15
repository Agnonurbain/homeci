import { useState, useRef } from 'react';
import { CheckCircle, ScrollText, Shield, AlertTriangle, Scale } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { KenteLine } from './ui/KenteLine';

interface CGVNotaireModalProps {
  onAccept: () => void;
  onClose: () => void;
}

export default function CGVNotaireModal({ onAccept, onClose }: CGVNotaireModalProps) {
  const { user, refreshProfile } = useAuth();
  useBodyScrollLock(true);
  const [checked, setChecked] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) setHasScrolledToBottom(true);
  };

  const handleAccept = async () => {
    if (!user || !checked) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        cgv_notaire_accepted: true,
        cgv_notaire_accepted_at: new Date().toISOString(),
        updated_at: serverTimestamp(),
      });
      await refreshProfile();
      onAccept();
    } catch (err) {
      console.error('[HOMECI] Erreur CGV Notaire:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(10,22,14,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: HColors.night, border: `1px solid ${HAlpha.gold20}`, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <KenteLine />
          <div className="flex items-center gap-3 mt-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: HAlpha.gold12, border: `1px solid ${HAlpha.gold20}` }}>
              <Scale className="w-5 h-5" style={{ color: HColors.gold }} />
            </div>
            <div>
              <h2 className="text-lg font-bold"
                style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
                Charte du Notaire Agréé HOMECI
              </h2>
              <p className="text-xs" style={{ color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>
                Veuillez lire et accepter avant de prendre en charge votre premier dossier
              </p>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div ref={scrollRef} onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 pb-2"
          style={{ maxHeight: '50vh' }}>
          <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-4"
            style={{ color: 'rgba(245,230,200,0.75)', fontFamily: 'var(--font-nunito)' }}>

            <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
              style={{ background: HAlpha.gold05, border: `1px solid ${HAlpha.gold15}` }}>
              <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: HColors.gold }} />
              <p className="text-xs" style={{ color: HColors.gold }}>
                Ce document constitue un engagement professionnel et déontologique entre vous,
                notaire agréé, et la plateforme HOMECI. Lisez-le attentivement avant d'accepter.
              </p>
            </div>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 1 — Objet
            </h3>
            <p>
              La présente charte définit les obligations et responsabilités du notaire agréé dans le cadre
              de sa mission de vérification et de certification des biens immobiliers publiés sur la plateforme HOMECI.
              En acceptant cette charte, le notaire s'engage à exercer sa mission avec diligence,
              impartialité et conformément aux lois ivoiriennes en vigueur.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 2 — Qualifications et agrément
            </h3>
            <p>Le notaire agréé HOMECI déclare et garantit :</p>
            <p style={{ paddingLeft: '1rem' }}>
              a) Être titulaire d'un diplôme de notaire reconnu par l'État de Côte d'Ivoire
              et inscrit au tableau de l'Ordre des notaires.
            </p>
            <p style={{ paddingLeft: '1rem' }}>
              b) Disposer d'une assurance responsabilité civile professionnelle en cours de validité.
            </p>
            <p style={{ paddingLeft: '1rem' }}>
              c) Ne faire l'objet d'aucune sanction disciplinaire en cours ni d'interdiction d'exercer.
            </p>
            <p style={{ paddingLeft: '1rem' }}>
              d) Avoir obtenu un code d'invitation valide délivré par l'administration HOMECI.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 3 — Obligations de vérification
            </h3>
            <p>Pour chaque dossier pris en charge, le notaire s'engage à :</p>
            <p style={{ paddingLeft: '1rem' }}>
              a) Vérifier l'authenticité et la validité de l'ensemble des documents légaux soumis
              par le propriétaire (titre foncier, permis de construire, registre de commerce, pièces d'identité, etc.).
            </p>
            <p style={{ paddingLeft: '1rem' }}>
              b) S'assurer de la concordance entre les documents fournis et les informations déclarées
              sur l'annonce (superficie, localisation, type de bien).
            </p>
            <p style={{ paddingLeft: '1rem' }}>
              c) Effectuer les vérifications dans un délai raisonnable de 48 à 72 heures ouvrées
              après la prise en charge du dossier.
            </p>
            <p style={{ paddingLeft: '1rem' }}>
              d) Motiver tout refus de validation d'un document par une explication claire et précise.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 4 — Confidentialité et protection des données
            </h3>
            <p>
              Le notaire s'engage à traiter de manière strictement confidentielle l'ensemble des documents
              et informations personnelles des propriétaires auxquels il a accès dans le cadre de sa mission.
              Il s'interdit de divulguer, copier, reproduire ou utiliser ces informations à des fins
              autres que la vérification sur HOMECI, conformément à la loi n°2013-450 relative
              à la protection des données à caractère personnel en Côte d'Ivoire.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 5 — Impartialité et conflits d'intérêts
            </h3>
            <p>
              Le notaire s'engage à exercer sa mission en toute impartialité. Il ne doit pas prendre en charge
              un dossier s'il existe un lien personnel, familial ou commercial avec le propriétaire du bien.
              En cas de conflit d'intérêts avéré ou potentiel, le notaire doit se récuser et signaler
              la situation à l'administration HOMECI.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 6 — Responsabilité professionnelle
            </h3>
            <p>
              Le notaire agréé engage sa responsabilité professionnelle sur chaque certification émise.
              En cas de certification frauduleuse ou négligente, HOMECI se réserve le droit de suspendre
              ou révoquer l'agrément du notaire, sans préjudice des poursuites judiciaires éventuelles.
              Le notaire demeure personnellement responsable de ses actes de certification.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 7 — Rémunération
            </h3>
            <p>
              Les conditions de rémunération du notaire pour ses prestations de vérification sur HOMECI
              sont définies par un accord distinct. Le tarif de certification est fixé à 75 000 FCFA
              par dossier, payé par le propriétaire via les moyens de paiement de la plateforme
              (Orange Money, MTN MoMo, Wave, Flooz). Le notaire recevra sa part selon les modalités
              convenues avec l'administration HOMECI.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 8 — Suspension et révocation
            </h3>
            <p>
              HOMECI se réserve le droit de suspendre temporairement ou de révoquer définitivement
              l'agrément d'un notaire en cas de manquement aux obligations de la présente charte,
              de plaintes vérifiées de propriétaires, ou de non-respect des délais de traitement.
              Le notaire sera informé par notification sur la plateforme.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 9 — Droit applicable
            </h3>
            <p>
              La présente charte est régie par le droit ivoirien, notamment la loi n°2014-138 du 24 mars 2014
              portant organisation de la profession de notaire. Tout litige relatif à son interprétation
              ou exécution sera soumis aux juridictions compétentes d'Abidjan, Côte d'Ivoire.
            </p>

            <p className="pt-3" style={{ color: 'rgba(245,230,200,0.4)', fontStyle: 'italic', fontSize: '0.75rem' }}>
              Dernière mise à jour : Mars 2026
            </p>
          </div>
        </div>

        {/* Indication de scroll */}
        {!hasScrolledToBottom && (
          <div className="px-6 py-2 flex items-center gap-2 text-xs shrink-0"
            style={{ color: 'rgba(212,160,23,0.6)', fontFamily: 'var(--font-nunito)', borderTop: `1px solid ${HAlpha.gold10}` }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Faites défiler pour lire l'intégralité de la charte
          </div>
        )}

        {/* Footer : checkbox + boutons */}
        <div className="px-6 py-4 shrink-0"
          style={{ borderTop: `1px solid ${HAlpha.gold15}`, background: 'rgba(10,22,14,0.5)' }}>

          <label className="flex items-start gap-3 cursor-pointer mb-4 select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className="mt-0.5 w-4 h-4 rounded accent-amber-500"
            />
            <span className="text-sm leading-snug"
              style={{
                color: hasScrolledToBottom ? HColors.cream : 'rgba(245,230,200,0.35)',
                fontFamily: 'var(--font-nunito)',
              }}>
              J'ai lu et j'accepte la Charte du Notaire Agréé HOMECI.
              Je m'engage à exercer ma mission de vérification avec diligence, impartialité et confidentialité.
            </span>
          </label>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                       color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>
              Annuler
            </button>
            <button onClick={handleAccept}
              disabled={!checked || !hasScrolledToBottom || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: checked && hasScrolledToBottom ? HColors.gold : 'rgba(212,160,23,0.2)',
                color: checked && hasScrolledToBottom ? HColors.night : 'rgba(245,230,200,0.3)',
                fontFamily: 'var(--font-nunito)',
              }}>
              {saving ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {saving ? 'Enregistrement...' : 'Accepter et continuer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
