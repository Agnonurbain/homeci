import { useState, useEffect } from 'react';
import { visitService, type VisitRequest } from '../services/visitService';
import { propertyService, type Property } from '../services/propertyService';
import { analyticsService } from '../services/analyticsService';

export function useTenantVisits(
  userId: string | undefined, 
  fullName: string = 'Locataire',
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void
) {
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([]);
  const [visitProperties, setVisitProperties] = useState<Record<string, Property>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubVisits = visitService.listenToVisitRequestsByTenant(userId, (visits) => {
      setVisitRequests(visits);
      
      const ids = [...new Set(visits.map(v => v.property_id))];
      // Fetch property details for those visits if not already present
      Promise.all(ids.map(id => propertyService.getProperty(id)))
        .then(props => {
          const map: Record<string, Property> = {};
          props.forEach(p => { if (p) map[p.id] = p; });
          setVisitProperties(prev => ({ ...prev, ...map }));
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching visit properties:', err);
          setLoading(false);
        });
    });

    return () => unsubVisits();
  }, [userId]);

  const handleAcceptCounter = async (visit: VisitRequest) => {
    try {
      await visitService.acceptCounterDate(visit.id, { 
        notify: true, 
        acceptorName: fullName 
      });
      if (onShowToast) onShowToast('Date acceptée avec succès', 'success');
    } catch (e: any) {
      console.error('Error accepting counter:', e);
      if (onShowToast) onShowToast(e?.message || 'Erreur lors de l\'acceptation', 'error');
      throw e;
    }
  };

  const handleProposeCounter = async (visitId: string, date: string, time: string) => {
    try {
      await visitService.proposeCounterDate(visitId, date, time, 'tenant', { 
        notify: true, 
        proposerName: fullName 
      });
      if (onShowToast) onShowToast('Contre-proposition envoyée', 'success');
    } catch (e: any) {
      console.error('Error proposing counter:', e);
      if (onShowToast) onShowToast(e?.message || 'Erreur lors de l\'envoi', 'error');
      throw e;
    }
  };

  const requestVisit = async (property: Property, date: string, time: string, profile: any) => {
    const existing = visitRequests.find(v => v.property_id === property.id && v.status !== 'rejected');
    if (existing) {
      throw new Error('Vous avez déjà une demande de visite pour ce bien.');
    }

    try {
      await visitService.createVisitRequest({
        property_id: property.id,
        property_title: property.title,
        property_city: property.city,
        owner_id: property.owner_id,
        tenant_id: userId!,
        tenant_name: profile?.full_name || 'Locataire',
        tenant_phone: profile?.phone || '',
        tenant_email: profile?.email || '',
        preferred_date: date,
        preferred_time: time,
      }, { notify: true, tenantName: profile?.full_name || 'Un locataire' });

      analyticsService.requestVisit(property.id);
      if (onShowToast) onShowToast('Demande de visite envoyée !', 'success');
    } catch (e: any) {
      console.error('Error creating visit request:', e);
      if (onShowToast) onShowToast(e?.message || 'Erreur lors de la demande', 'error');
      throw e;
    }
  };

  return {
    visitRequests,
    visitProperties,
    loading,
    handleAcceptCounter,
    handleProposeCounter,
    requestVisit
  };
}
