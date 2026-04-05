import { useState, useEffect, useMemo, useRef } from 'react';
import { getDoc, doc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import { propertyService } from '../services/propertyService';
import { notificationService } from '../services/notificationService';
import { visitService } from '../services/visitService';
import { analyticsService } from '../services/analyticsService';
import { delegateService } from '../services/delegateService';
import { emailService } from '../services/emailService';
import type { Property } from '../services/propertyService';
import { REQUIRED_DOCS } from '../constants/labels';

export type DocStatus = 'en_attente' | 'valide' | 'refuse';
export type TabId = 'disponible' | 'en_cours' | 'pret' | 'certifie';

interface OwnerProfile {
  full_name: string;
  phone?: string;
  email?: string;
}

export function isReadyToCertify(p: Property) {
  const req = REQUIRED_DOCS[p.property_type] || ['titre_foncier'];
  const hasRequiredDocs = req.every((r: string) => p.documents?.find(d => d.type === r)?.status === 'valide');
  const identityTypes = ['cni', 'passeport', 'attestation_residence', 'carte_sejour', 'registre_commerce_proprio'];
  const hasIdentity = p.documents?.some(d => identityTypes.includes(d.type) && d.status === 'valide');
  return hasRequiredDocs && !!hasIdentity;
}

export function getDocStatus(p: Property): 'aucun' | 'partiel' | 'complet' | 'certifie' {
  if (p.verified_notaire) return 'certifie';
  if (!p.documents?.length) return 'aucun';
  return isReadyToCertify(p) ? 'complet' : p.documents.some(d => d.status === 'valide') ? 'partiel' : 'aucun';
}

export function useNotaireDashboard(notaryProfile: any, showToast: (msg: string, ok?: boolean) => void) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Record<string, OwnerProfile>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [takingId, setTakingId] = useState<string | null>(null);
  const [certifyingId, setCertifyingId] = useState<string | null>(null);
  
  // Modals & Token states
  const [revokeModal, setRevokeModal] = useState<{
    property: Property;
    reason: string;
    hasActiveVisit: boolean;
    loading: boolean;
  } | null>(null);
  const [delegationToken, setDelegationToken] = useState<{ token: string; action: 'certify' | 'reject'; propertyTitle: string } | null>(null);

  const ownersRef = useRef(owners);
  ownersRef.current = owners;

  useEffect(() => {
    if (!notaryProfile?.id) return;

    const q = query(collection(db, 'properties'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Property));
      
      const relevant = all.filter(p => 
        p.notaire_id === notaryProfile.id || 
        (!p.notaire_id && !p.verified_notaire && p.status === 'pending')
      );

      // Async enrichment
      const enrich = async () => {
        try {
          if (relevant.length === 0) {
            setProperties([]);
            setLoading(false);
            return;
          }

          // Les documents sont déjà inclus dans le snapshot (champ array du document principal)
          // Pas besoin de charger la sous-collection /documents/ qui n'est pas utilisée par le formulaire
          setProperties([...relevant]);
          
          const missingIds = [...new Set(withDocs.map(p => p.owner_id))].filter(id => !ownersRef.current?.[id]);
          if (missingIds.length > 0) {
            const newEntries = await Promise.all(missingIds.map(async id => {
              try {
                const snap = await getDoc(doc(db, 'users', id));
                if (snap.exists()) { 
                  const d = snap.data(); 
                  return [id, { full_name: d.full_name || 'Propriétaire', phone: d.phone, email: d.email }] as [string, OwnerProfile]; 
                }
              } catch { /* ignored */ }
              return [id, { full_name: 'Propriétaire' }] as [string, OwnerProfile];
            }));
            setOwners(prev => ({ ...prev, ...Object.fromEntries(newEntries) }));
          }
        } catch (err) {
          console.error('[HOMECI] Notaire enrichment error:', err);
        } finally {
          setLoading(false);
        }
      };

      enrich();
    }, (err) => {
      console.error('[HOMECI] Notaire listener error:', err);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [notaryProfile?.id]);

  const handleDocAction = async (property: Property, docType: string, newStatus: DocStatus, reason?: string) => {
    const key = `${docType}:${property.id}`;
    if (newStatus === 'refuse' && !reason?.trim()) {
      showToast('Motif de refus obligatoire (Art. 4d).', false);
      return;
    }

    setActionLoading(key);
    try {
      await propertyService.updateDocumentStatus(property.id, docType, newStatus, {
        validated_by: notaryProfile?.id,
        ...(newStatus === 'refuse' ? { rejection_reason: reason } : {}),
      });

      await notificationService.createNotification({
        user_id: property.owner_id,
        type: 'notaire_approved',
        title: `📄 Document ${newStatus === 'valide' ? 'validé' : 'refusé'}`,
        message: `Votre document pour "${property.title}" a été ${newStatus === 'valide' ? 'validé ✅' : 'refusé ❌'}${reason ? ` : ${reason}` : ''}`,
        property_id: property.id,
      });

      showToast('Document mis à jour.');
    } catch (e) {
      showToast('Erreur lors de la mise à jour.', false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCertify = async (property: Property) => {
    if (!isReadyToCertify(property)) return;
    setCertifyingId(property.id);
    try {
      const certifyPropertyFn = httpsCallable(functions, 'certifyProperty');
      await certifyPropertyFn({ propertyId: property.id, action: 'certify' });

      analyticsService.certifyProperty(property.id);
      showToast('Bien certifié avec succès ! 🏆');
      
      const owner = owners[property.owner_id];
      if (owner?.email) {
        emailService.notifyPropertyApproval(owner.email, property.title).catch(console.error);
      }
    } catch (e: any) {
      showToast(e.message || 'Certification échouée', false);
    } finally {
      setCertifyingId(null);
    }
  };

  const doTakeCharge = async (property: Property) => {
    if (!notaryProfile?.id) return;
    setTakingId(property.id);
    try {
      await propertyService.updateProperty(property.id, {
        notaire_id: notaryProfile.id,
        notaire_taken_at: new Date().toISOString(),
      });

      await notificationService.createNotification({
        user_id: property.owner_id,
        type: 'system',
        title: '📋 Dossier en cours d\'examen',
        message: `Me ${notaryProfile.full_name} a pris en charge votre dossier pour "${property.title}".`,
        property_id: property.id,
      });

      showToast('Dossier pris en charge.');
    } catch (e: any) {
      console.error('[HOMECI] Prise en charge échouée:', e?.code, e?.message, e);
      showToast('Échec de la prise en charge.', false);
    } finally {
      setTakingId(null);
    }
  };

  const handleRevoke = async (property: Property, reason: string) => {
    if (!reason.trim()) return;
    setRevokeModal(prev => prev ? { ...prev, loading: true } : null);
    try {
      const certifyPropertyFn = httpsCallable(functions, 'certifyProperty');
      await certifyPropertyFn({ propertyId: property.id, action: 'reject', reason: reason.trim() });
      
      // Cancel active visits
      const hasActive = await visitService.hasActiveVisit(property.id);
      if (hasActive) {
        const ownerVisits = await visitService.getVisitRequestsByOwner(property.owner_id);
        const activeVisits = ownerVisits.filter(v => v.property_id === property.id && (v.status === 'accepted' || v.status === 'completed'));
        for (const visit of activeVisits) {
          await visitService.updateVisitStatus(visit.id, 'rejected');
          await notificationService.createNotification({
            user_id: visit.tenant_id,
            type: 'visit_rejected',
            title: '⚠️ Certification retirée',
            message: `La visite de "${property.title}" est annulée. Certification retirée par le notaire.`,
            property_id: property.id,
          });
        }
      }

      analyticsService.decertifyProperty(property.id, reason);
      showToast('Certification retirée.');
      setRevokeModal(null);
    } catch (e) {
      showToast('Erreur lors du retrait.', false);
    } finally {
      setRevokeModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  const handleDelegateAction = async (property: Property, action: 'certify' | 'reject', reason?: string) => {
    setCertifyingId(property.id);
    try {
      const token = await delegateService.createToken({
        notary_id: notaryProfile!.id,
        property_id: property.id,
        property_title: property.title,
        action,
        rejection_reason: reason,
      });
      setDelegationToken({ token, action, propertyTitle: property.title });
      showToast('Jeton généré.');
    } catch (e) {
      showToast('Erreur génération jeton.', false);
    } finally {
      setCertifyingId(null);
    }
  };

  const stats = useMemo(() => {
    const di: Property[] = [], ec: Property[] = [], pr: Property[] = [], ce: Property[] = [];
    for (const p of properties) {
      if (!p.notaire_id) { di.push(p); continue; }
      if (p.notaire_id === notaryProfile?.id) {
        const s = getDocStatus(p);
        if (s === 'certifie') ce.push(p);
        else if (s === 'complet') pr.push(p);
        else ec.push(p);
      }
    }
    const activeProp = [...ec, ...pr];
    return {
      disponible: di.length, enCours: ec.length, pret: pr.length, certifie: ce.length,
      docsAttente: activeProp.flatMap(p => p.documents || []).filter(d => d.status === 'en_attente').length,
      lists: { disponible: di, en_cours: ec, pret: pr, certifie: ce }
    };
  }, [properties, notaryProfile?.id]);

  return {
    loading,
    properties,
    owners,
    stats,
    actionLoading,
    takingId,
    certifyingId,
    revokeModal,
    setRevokeModal,
    delegationToken,
    setDelegationToken,
    handleDocAction,
    handleCertify,
    doTakeCharge,
    handleRevoke,
    handleDelegateAction
  };
}
