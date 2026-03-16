import { useState } from 'react';
import { X, Star, Send, CheckCircle } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { surveyService } from '../services/surveyService';

interface SatisfactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userRole: string;
  trigger: 'visit_accepted' | 'visit_completed' | 'property_rented' | 'property_sold';
  propertyId?: string;
  propertyTitle?: string;
}

const TRIGGER_MESSAGES: Record<string, string> = {
  visit_accepted: 'Votre visite a été confirmée !',
  visit_completed: 'Votre visite est terminée !',
  property_rented: 'Votre bien a été loué avec succès !',
  property_sold: 'Votre bien a été vendu avec succès !',
};

const STAR_LABELS = ['Très insatisfait', 'Insatisfait', 'Neutre', 'Satisfait', 'Très satisfait'];

export default function SatisfactionModal({
  isOpen, onClose, userId, userRole, trigger, propertyId, propertyTitle,
}: SatisfactionModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await surveyService.submitSurvey({
        user_id: userId,
        user_role: userRole,
        rating,
        comment: comment.trim(),
        trigger,
        property_id: propertyId,
        property_title: propertyTitle,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setRating(0); setComment(''); setSubmitted(false);
      }, 2000);
    } catch (e) {
      console.error('[HOMECI] Erreur enquête:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
    setRating(0); setComment(''); setSubmitted(false);
  };

  const activeStar = hoveredStar || rating;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(13,31,18,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: HColors.night, border: `1px solid ${HAlpha.gold20}` }}>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 text-center">
          <button onClick={handleSkip}
            className="absolute top-4 right-4 p-1.5 rounded-full transition-all hover:opacity-70"
            style={{ color: HAlpha.cream70 }}>
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{ background: HAlpha.gold12, border: `2px solid ${HAlpha.gold30}` }}>
            <Star className="w-7 h-7" style={{ color: HColors.gold }} />
          </div>

          <h2 className="text-lg font-bold mb-1"
            style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>
            {submitted ? 'Merci pour votre retour !' : 'Votre avis compte'}
          </h2>

          <p className="text-sm" style={{ color: HAlpha.cream70, fontFamily: 'var(--font-nunito)' }}>
            {submitted
              ? 'Votre avis nous aide à améliorer HOMECI'
              : TRIGGER_MESSAGES[trigger] || 'Comment évaluez-vous votre expérience ?'
            }
          </p>

          {propertyTitle && !submitted && (
            <p className="mt-1 text-xs font-medium px-3 py-1 rounded-full inline-block"
              style={{ background: HAlpha.gold08, color: HColors.gold, fontFamily: 'var(--font-nunito)' }}>
              {propertyTitle}
            </p>
          )}
        </div>

        {submitted ? (
          /* ── Confirmation ── */
          <div className="px-6 pb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ background: HAlpha.vertCI10, border: `2px solid ${HAlpha.vertCI25}` }}>
              <CheckCircle className="w-8 h-8" style={{ color: HColors.vertCI }} />
            </div>
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-5 h-5"
                  fill={i <= rating ? HColors.gold : 'transparent'}
                  style={{ color: i <= rating ? HColors.gold : HAlpha.gold25 }} />
              ))}
            </div>
            <p className="text-xs" style={{ color: HAlpha.cream70, fontFamily: 'var(--font-nunito)' }}>
              {STAR_LABELS[rating - 1]}
            </p>
          </div>
        ) : (
          /* ── Formulaire ── */
          <div className="px-6 pb-6">
            {/* Étoiles */}
            <div className="flex justify-center gap-2 mb-2 py-3">
              {[1, 2, 3, 4, 5].map(i => (
                <button key={i} type="button"
                  onMouseEnter={() => setHoveredStar(i)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(i)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                  aria-label={`${i} étoile${i > 1 ? 's' : ''}`}>
                  <Star className="w-9 h-9 transition-colors"
                    fill={i <= activeStar ? HColors.gold : 'transparent'}
                    strokeWidth={1.5}
                    style={{ color: i <= activeStar ? HColors.gold : HAlpha.gold25 }} />
                </button>
              ))}
            </div>

            {/* Label dynamique */}
            <p className="text-center text-xs mb-5 h-4"
              style={{ color: activeStar ? HColors.gold : HAlpha.cream70, fontFamily: 'var(--font-nunito)' }}>
              {activeStar ? STAR_LABELS[activeStar - 1] : 'Touchez pour noter'}
            </p>

            {/* Commentaire */}
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Un commentaire ? (optionnel)"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
              style={{
                background: 'rgba(13,31,18,0.6)',
                border: `1px solid ${HAlpha.gold15}`,
                color: HColors.cream,
                fontFamily: 'var(--font-nunito)',
              }}
            />
            <p className="text-right text-xs mt-1 mb-4"
              style={{ color: HAlpha.cream70, fontFamily: 'var(--font-nunito)' }}>
              {comment.length}/500
            </p>

            {/* Boutons */}
            <div className="space-y-2">
              <button onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                {submitting
                  ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  : <Send className="w-4 h-4" />
                }
                Envoyer mon avis
              </button>
              <button onClick={handleSkip}
                className="w-full py-2.5 text-xs font-medium transition-all hover:opacity-70"
                style={{ color: HAlpha.cream70, fontFamily: 'var(--font-nunito)' }}>
                Plus tard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
