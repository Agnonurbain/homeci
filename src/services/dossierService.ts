import {
  collection, doc, updateDoc, getDoc, serverTimestamp, query, where, getDocs, orderBy, limit as firestoreLimit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { compressImage, COMPRESS_PRESETS } from '../utils/compressImage';

// Liste des documents requis pour un dossier complet
export const REQUIRED_DOSSIER_DOCS = [
  'pay_slip_1',
  'pay_slip_2',
  'pay_slip_3',
  'employment_proof',
] as const;

// Liste de tous les documents possibles
export const ALL_DOSSIER_DOCS = [
  ...REQUIRED_DOSSIER_DOCS,
  'guarantor_identity',
  'guarantor_income',
] as const;

export type DossierDocId = typeof ALL_DOSSIER_DOCS[number];

export interface DossierStats {
  totalRequired: number;
  completedRequired: number;
  totalOptional: number;
  completedOptional: number;
  progress: number;
  isComplete: boolean;
  canSubmit: boolean;
}

export interface DossierService {
  /**
   * Upload un document du dossier locataire vers Storage
   */
  uploadDocument(userId: string, docId: string, file: File): Promise<string>;

  /**
   * Supprime un document du dossier (Storage + Firestore)
   */
  deleteDocument(userId: string, docId: string, currentUrl: string): Promise<void>;

  /**
   * Met à jour le statut d'un document dans Firestore
   */
  updateDocumentStatus(userId: string, docId: string, status: 'provided' | 'pending'): Promise<void>;

  /**
   * Calcule les statistiques du dossier (progression, complétude)
   */
  calculateStats(dossier: Record<string, unknown> | undefined): DossierStats;

  /**
   * Valide que le dossier est complet (tous les docs requis présents)
   */
  isDossierComplete(dossier: Record<string, unknown> | undefined): boolean;

  /**
   * Soumet le dossier (marque comme prêt pour examen par les propriétaires)
   */
  submitDossier(userId: string): Promise<void>;

  /**
   * Récupère le dossier d'un utilisateur depuis Firestore
   */
  getDossier(userId: string): Promise<Record<string, unknown> | null>;

  /**
   * Recherche des locataires avec un dossier complet et soumis
   * (utilisé par les propriétaires pour filtrer les candidats sérieux)
   */
  findTenantsWithCompleteDossier(maxResults?: number): Promise<Array<{
    uid: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    submitted_at: string | null;
  }>>;
}

/**
 * Upload un document du dossier locataire vers Storage
 * Compresse les images automatiquement
 */
async function uploadDocumentToStorage(
  file: File,
  userId: string,
  docId: string
): Promise<string> {
  let fileToUpload = file;
  if (file.type.startsWith('image/')) {
    fileToUpload = await compressImage(file, COMPRESS_PRESETS.avatar);
  }

  const ext = file.name.split('.').pop() || 'pdf';
  const path = `tenant_dossiers/${userId}/${docId}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, fileToUpload);
  return getDownloadURL(storageRef);
}

/**
 * Supprime un fichier du Storage
 */
async function deleteDocumentFromStorage(fileUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('[dossierService] Failed to delete document from storage:', err);
  }
}

export const dossierService: DossierService = {
  async uploadDocument(userId: string, docId: string, file: File): Promise<string> {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Le fichier est trop volumineux (max 5 Mo)');
    }

    // Validate accepted file types
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!acceptedTypes.includes(file.type)) {
      throw new Error('Format non accepté. Utilisez PDF, JPG, PNG ou WebP.');
    }

    return uploadDocumentToStorage(file, userId, docId);
  },

  async deleteDocument(userId: string, docId: string, currentUrl: string): Promise<void> {
    // Delete from storage
    await deleteDocumentFromStorage(currentUrl);

    // Clear Firestore fields
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`dossier.${docId}_url`]: null,
      [`dossier.${docId}_status`]: null,
      'dossier.last_updated': new Date().toISOString(),
    });
  },

  async updateDocumentStatus(userId: string, docId: string, status: 'provided' | 'pending'): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`dossier.${docId}_status`]: status,
      'dossier.last_updated': new Date().toISOString(),
    });
  },

  calculateStats(dossier: Record<string, unknown> | undefined): DossierStats {
    const totalRequired = REQUIRED_DOSSIER_DOCS.length;
    const completedRequired = REQUIRED_DOSSIER_DOCS.filter(
      docId => !!(dossier as any)?.[`${docId}_url`]
    ).length;

    const optionalDocs = ALL_DOSSIER_DOCS.filter(
      d => !REQUIRED_DOSSIER_DOCS.includes(d as any)
    ) as readonly DossierDocId[];
    const totalOptional = optionalDocs.length;
    const completedOptional = optionalDocs.filter(
      docId => !!(dossier as any)?.[`${docId}_url`]
    ).length;

    const progress = totalRequired > 0
      ? Math.round((completedRequired / totalRequired) * 100)
      : 0;

    const isComplete = completedRequired === totalRequired;
    // Can submit when all required docs are present
    const canSubmit = isComplete;

    return {
      totalRequired,
      completedRequired,
      totalOptional,
      completedOptional,
      progress,
      isComplete,
      canSubmit,
    };
  },

  isDossierComplete(dossier: Record<string, unknown> | undefined): boolean {
    return REQUIRED_DOSSIER_DOCS.every(
      docId => !!(dossier as any)?.[`${docId}_url`]
    );
  },

  async submitDossier(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('Utilisateur introuvable.');
    }

    const userData = userSnap.data();
    const dossier = userData?.dossier;

    // Validate completeness before submission
    if (!this.isDossierComplete(dossier)) {
      throw new Error('Le dossier n\'est pas complet. Veuillez ajouter tous les documents requis.');
    }

    await updateDoc(userRef, {
      'dossier.overall_status': 'submitted',
      'dossier.submitted_at': new Date().toISOString(),
      'dossier.last_updated': new Date().toISOString(),
      updated_at: serverTimestamp(),
    });
  },

  async getDossier(userId: string): Promise<Record<string, unknown> | null> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;

    return (userSnap.data() as any)?.dossier ?? null;
  },

  async findTenantsWithCompleteDossier(maxResults: number = 20) {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'locataire'),
      where('dossier.overall_status', '==', 'submitted'),
      orderBy('dossier.submitted_at', 'desc'),
      firestoreLimit(maxResults)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data() as any;
      return {
        uid: d.id,
        full_name: data.full_name || '',
        email: data.email || '',
        avatar_url: data.avatar_url || null,
        submitted_at: data.dossier?.submitted_at || null,
      };
    });
  },
};
