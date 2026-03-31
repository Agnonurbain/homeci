import { useState, useEffect, useMemo, useCallback } from 'react';
import { visitService, type VisitRequest } from '../services/visitService';
import { notificationService } from '../services/notificationService';
import { propertyService } from '../services/propertyService';
import { emailService } from '../services/emailService';
import { analyticsService } from '../services/analyticsService';

/* ── Types ────────────────────────────────────────────────────────────────── */

export type VisitFilter = 'all' | 'pending' | 'accepted' | 'rejected';
export type VisitAction = 'accepted' | 'rejected' | 'counter';

export interface DisclaimerData {
  propertyTitle: string;
  visitDate: string;
}

export interface SurveyData {
  trigger: 'visit_accepted' | 'visit_completed';
  propertyId?: string;
  propertyTitle?: string;
}

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useOwnerVisits(
  userId: string | undefined,
  flagNeedsStatusUpdate: (propertyId: string) => void,
) {
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [filter, setFilter] = useState<VisitFilter>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitRequest | null>(null);
  const [counterDate, setCounterDate] = useState('');
  const [counterTime, setCounterTime] = useState('');
  const [disclaimerVisit, setDisclaimerVisit] = useState<DisclaimerData | null>(null);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);

  /* ── Firestore listener ── */
  useEffect(() => {
    if (!userId) return;
    const unsub = visitService.listenToVisitRequestsByOwner(userId, (v) => setVisits(v));
    return unsub;
  }, [userId]);

  /* ── Derived ── */
  const filteredVisits = useMemo(() =>
    filter === 'all'
      ? visits
      : visits.filter(v => v.status === filter || (filter === 'accepted' && v.status === 'completed')),
    [visits, filter]);

  const pendingCount = useMemo(() => visits.filter(v => v.status === 'pending').length, [visits]);

  /* ── Handlers ── */
  const openVisitResponse = useCallback((visit: VisitRequest) => {
    setSelectedVisit(visit);
    setCounterDate('');
    setCounterTime('');
  }, []);

  const closeVisitResponse = useCallback(() => {
    setSelectedVisit(null);
    setCounterDate('');
    setCounterTime('');
  }, []);

  const respondToVisit = useCallback(async (action: VisitAction) => {
    if (!selectedVisit || actionLoading) return;
    if (action === 'counter' && (!counterDate || !counterTime)) return;
    setActionLoading(true);
    try {
      if (action === 'counter') {
        await visitService.proposeCounterDate(selectedVisit.id, counterDate, counterTime, 'owner');
        await notificationService.createNotification({
          user_id: selectedVisit.tenant_id,
          type: 'visit_request',
          title: '📅 Nouvelle date proposée',
          message: `Le propriétaire propose une visite de "${selectedVisit.property_title}" le ${new Date(counterDate).toLocaleDateString('fr-FR')} à ${counterTime}.`,
          property_id: selectedVisit.property_id,
        });
        setVisits(prev => prev.map(v =>
          v.id === selectedVisit.id
            ? { ...v, status: 'counter_proposed', counter_date: counterDate, counter_time: counterTime, counter_proposed_by: 'owner' }
            : v
        ));
      } else if (action === 'accepted' && selectedVisit.status === 'counter_proposed' && selectedVisit.counter_proposed_by === 'tenant' && selectedVisit.counter_date) {
        await visitService.acceptCounterDate(selectedVisit.id);
        const confirmedDate = new Date(selectedVisit.counter_date).toLocaleDateString('fr-FR');
        const confirmedTime = selectedVisit.counter_time || selectedVisit.preferred_time;
        await notificationService.createNotification({
          user_id: selectedVisit.tenant_id,
          type: 'visit_accepted',
          title: 'Visite confirmée ✅',
          message: `Votre proposition pour "${selectedVisit.property_title}" le ${confirmedDate} à ${confirmedTime} est confirmée.`,
          property_id: selectedVisit.property_id,
        });
        setVisits(prev => prev.map(v =>
          v.id === selectedVisit.id
            ? { ...v, status: 'accepted', preferred_date: selectedVisit.counter_date!, preferred_time: confirmedTime, counter_date: undefined, counter_time: undefined, counter_proposed_by: undefined }
            : v
        ));
        if (selectedVisit.tenant_email) {
          emailService.notifyVisitUpdate(selectedVisit.tenant_email, selectedVisit.property_title || 'votre bien', 'approved').catch(console.error);
        }
      } else {
        await visitService.updateVisitStatus(selectedVisit.id, action as 'accepted' | 'rejected');
        await notificationService.createNotification({
          user_id: selectedVisit.tenant_id,
          type: action === 'accepted' ? 'visit_accepted' : 'visit_rejected',
          title: action === 'accepted' ? 'Visite confirmée ✅' : 'Visite refusée',
          message: action === 'accepted'
            ? `Votre visite pour "${selectedVisit.property_title}" le ${new Date(selectedVisit.preferred_date).toLocaleDateString('fr-FR')} à ${selectedVisit.preferred_time} est confirmée.`
            : `Votre demande de visite pour "${selectedVisit.property_title}" a été refusée.`,
          property_id: selectedVisit.property_id,
        });
        setVisits(prev => prev.map(v => v.id === selectedVisit.id ? { ...v, status: action as any } : v));
        if (selectedVisit.tenant_email && (action === 'accepted' || action === 'rejected')) {
          emailService.notifyVisitUpdate(selectedVisit.tenant_email, selectedVisit.property_title || 'votre bien', action === 'accepted' ? 'approved' : 'rejected').catch(console.error);
        }
      }

      // Show disclaimer after acceptance
      if (action === 'accepted') {
        const visitDate = (selectedVisit.status === 'counter_proposed' && selectedVisit.counter_proposed_by === 'tenant' && selectedVisit.counter_date)
          ? selectedVisit.counter_date
          : selectedVisit.preferred_date;
        setDisclaimerVisit({ propertyTitle: selectedVisit.property_title || 'Bien sans titre', visitDate });
      }

      setSelectedVisit(null);
      setCounterDate('');
      setCounterTime('');
    } catch (e: any) {
      console.error('[HOMECI] Erreur visite:', e);
      alert(`Erreur : ${e?.message || 'Impossible de traiter la demande. Vérifiez votre connexion.'}`);
    } finally { setActionLoading(false); }
  }, [selectedVisit, actionLoading, counterDate, counterTime]);

  const markCompleted = useCallback(async (visit: VisitRequest) => {
    setActionLoading(true);
    try {
      await visitService.updateVisitStatus(visit.id, 'completed');
      await propertyService.updateProperty(visit.property_id, { needs_status_update: true });
      flagNeedsStatusUpdate(visit.property_id);
      await notificationService.createNotification({
        user_id: visit.tenant_id,
        type: 'visit_completed',
        title: 'Visite effectuée ✅',
        message: `Votre visite de "${visit.property_title}" a été marquée comme effectuée. Merci de partager votre avis !`,
        property_id: visit.property_id,
      });
      setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, status: 'completed' } : v));
      analyticsService.completeVisit(visit.id);
      setSurveyData({ trigger: 'visit_completed', propertyId: visit.property_id, propertyTitle: visit.property_title });
    } catch (e) {
      console.error('[HOMECI] Erreur marquage visite:', e);
    } finally { setActionLoading(false); }
  }, [flagNeedsStatusUpdate]);

  const dismissDisclaimer = useCallback(() => setDisclaimerVisit(null), []);
  const dismissSurvey = useCallback(() => setSurveyData(null), []);

  return {
    visits,
    filteredVisits,
    filter,
    setFilter,
    pendingCount,
    actionLoading,
    // Visit response modal state
    selectedVisit,
    counterDate,
    setCounterDate,
    counterTime,
    setCounterTime,
    openVisitResponse,
    closeVisitResponse,
    respondToVisit,
    // Mark completed
    markCompleted,
    // Post-action states
    disclaimerVisit,
    dismissDisclaimer,
    surveyData,
    setSurveyData,
    dismissSurvey,
  };
}
