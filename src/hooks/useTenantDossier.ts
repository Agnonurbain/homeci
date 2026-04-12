import { useState, useCallback } from 'react';
import { dossierService, type DossierStats } from '../services/dossierService';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UseTenantDossierProps {
  userId: string;
  dossier: Record<string, unknown> | undefined;
  onRefresh: () => Promise<void>;
}

interface UseTenantDossierReturn {
  stats: DossierStats;
  uploading: Record<string, boolean>;
  submitting: boolean;
  error: string | null;
  success: string | null;
  uploadDocument: (docId: string, file: File) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  submitDossier: () => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
}

export function useTenantDossier({
  userId,
  dossier,
  onRefresh,
}: UseTenantDossierProps): UseTenantDossierReturn {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const stats = dossierService.calculateStats(dossier);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccess(null), []);

  const uploadDocument = useCallback(async (docId: string, file: File) => {
    setUploading(prev => ({ ...prev, [docId]: true }));
    setError(null);
    setSuccess(null);

    try {
      const url = await dossierService.uploadDocument(userId, docId, file);

      // Update Firestore with the new document URL
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        updated_at: serverTimestamp(),
        [`dossier.${docId}_url`]: url,
        [`dossier.${docId}_status`]: 'provided',
        'dossier.last_updated': new Date().toISOString(),
        // Reset submission status if dossier was previously submitted
        ...(dossierService.isDossierComplete(dossier) && {
          'dossier.overall_status': 'incomplete',
        }),
      });

      setSuccess(`Document "${docId}" envoyé avec succès.`);
      await onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Échec de l\'envoi du document.');
    } finally {
      setUploading(prev => ({ ...prev, [docId]: false }));
    }
  }, [userId, dossier, onRefresh]);

  const deleteDocument = useCallback(async (docId: string) => {
    const currentUrl = (dossier as any)?.[`${docId}_url`] as string | undefined;
    if (!currentUrl) return;

    setError(null);
    setSuccess(null);

    try {
      await dossierService.deleteDocument(userId, docId, currentUrl);
      setSuccess(`Document "${docId}" supprimé.`);
      await onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la suppression.');
    }
  }, [userId, dossier, onRefresh]);

  const submitDossierFn = useCallback(async () => {
    if (!stats.canSubmit) {
      setError('Le dossier n\'est pas complet. Ajoutez tous les documents requis.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await dossierService.submitDossier(userId);
      setSuccess('Dossier soumis avec succès ! Il est maintenant visible par les propriétaires.');
      await onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la soumission du dossier.');
    } finally {
      setSubmitting(false);
    }
  }, [userId, stats.canSubmit, onRefresh]);

  return {
    stats,
    uploading,
    submitting,
    error,
    success,
    uploadDocument,
    deleteDocument,
    submitDossier: submitDossierFn,
    clearError,
    clearSuccess,
  };
}
