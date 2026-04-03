import { useState, useEffect, useMemo, useCallback } from 'react';
import { visitService, type VisitRequest } from '../services/visitService';
import { propertyService } from '../services/propertyService';
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
        await visitService.proposeCounterDate(selectedVisit.id, counterDate, counterTime, 'owner', {
          notify: true,
          proposerName: 'Le propriétaire'
        });
      } else if (action === 'accepted' && selectedVisit.status === 'counter_proposed' && selectedVisit.counter_proposed_by === 'tenant' && selectedVisit.counter_date) {
        await visitService.acceptCounterDate(selectedVisit.id, {
          notify: true,
          acceptorName: 'Le propriétaire'
        });
      } else {
        await visitService.updateVisitStatus(selectedVisit.id, action as 'accepted' | 'rejected', undefined, { notify: true });
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
      await visitService.updateVisitStatus(visit.id, 'completed', undefined, { notify: true });
      await propertyService.updateProperty(visit.property_id, { needs_status_update: true });
      flagNeedsStatusUpdate(visit.property_id);
      
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
