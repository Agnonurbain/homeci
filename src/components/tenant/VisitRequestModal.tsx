import { useState, useEffect } from 'react';
import { Calendar, Clock, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { availabilityService, type PropertyAvailability } from '../../services/availabilityService';
import type { Property } from '../../services/propertyService';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import ScrollTimePicker from '../ScrollTimePicker';

interface VisitRequestModalProps {
  property: Property | null;
  onClose: () => void;
  onSubmit: (date: string, time: string) => Promise<void>;
}

export default function VisitRequestModal({ property, onClose, onSubmit }: VisitRequestModalProps) {
  const [form, setForm] = useState({ date: '', time: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [availability, setAvailability] = useState<PropertyAvailability | null>(null);
  const [showAvailabilityHint, setShowAvailabilityHint] = useState(false);

  useEffect(() => {
    if (property) {
      availabilityService.getAvailability(property.id).then(setAvailability).catch(console.error);
    }
  }, [property]);

  if (!property) return null;

  const handleSubmit = async () => {
    if (!form.date || !form.time) return;
    setSubmitting(true);
    setError('');

    try {
      // Check availability if configured
      if (availability) {
        const d = new Date(form.date);
        const slots = availabilityService.getAvailableSlots(availability, d);
        if (slots.length === 0) {
          setError("Le propriétaire n'est pas disponible à cette date. Veuillez choisir un autre jour.");
          setSubmitting(false);
          return;
        }
      }

      await onSubmit(form.date, form.time);
      setSuccess(true);
      setTimeout(onClose, 2500);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0D1F12 0%, #1A0E00 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-cormorant)' }}>Plannifier une Visite</h3>
              <p className="text-[10px] text-white/50 uppercase tracking-widest">{property.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in zoom-in duration-500">
               <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle className="w-12 h-12" />
               </div>
               <h4 className="text-xl font-bold text-gray-900">Demande envoyée !</h4>
               <p className="text-sm text-gray-500">Le propriétaire a été notifié. Vous recevrez une notification dès qu'il aura répondu.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Date Souhaitée</label>
                  <input type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={form.date}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-gold focus:ring-0 transition-all outline-none text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Heure</label>
                  <ScrollTimePicker 
                    value={form.time}
                    onChange={(time) => setForm(f => ({ ...f, time }))}
                  />
                </div>
              </div>

              {availability && (
                <div className="p-4 rounded-2xl bg-navy-50 border border-navy-100 space-y-2">
                  <button onClick={() => setShowAvailabilityHint(!showAvailabilityHint)}
                    className="flex items-center gap-2 text-xs font-bold text-navy-700 hover:text-navy-900 transition-colors">
                    <Info className="w-4 h-4" /> Voir les disponibilités du propriétaire
                  </button>
                  {showAvailabilityHint && (
                    <div className="text-[10px] text-navy-800/70 leading-relaxed italic animate-in fade-in slide-in-from-top-1">
                      {availability.weekly_hours?.map((h, i) => (
                        h.slots.length > 0 && <div key={i}>{['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'][h.day === 0 ? 6 : h.day-1]} : {h.slots.join(', ')}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={handleSubmit}
                disabled={submitting || !form.date || !form.time}
                className="w-full py-4 rounded-2xl text-white font-bold shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #D4A017 100%)' }}>
                {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
