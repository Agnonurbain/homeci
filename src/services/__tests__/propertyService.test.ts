import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firestoreMocks, mockFirestore } from '../../tests/firebase.mock';

// Récupérer le Timestamp mocké pour créer des instances valides
const { Timestamp } = firestoreMocks;

// Les mocks doivent être importés AVANT le service
import { propertyService } from '../propertyService';

beforeEach(() => {
  vi.clearAllMocks();
  mockFirestore.reset();
});

describe('propertyService', () => {

  // ── createProperty ──

  describe('createProperty', () => {
    it('appelle addDoc avec les bonnes données + timestamps', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'new-prop-123' });

      const data = {
        owner_id: 'user1',
        title: 'Belle villa',
        property_type: 'villa' as const,
        transaction_type: 'vente' as const,
        price: 50000000,
        city: 'Cocody',
        images: [],
        status: 'pending' as const,
      };

      const id = await propertyService.createProperty(data as any);

      expect(id).toBe('new-prop-123');
      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);

      const calledWith = (firestoreMocks.addDoc.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
      expect((calledWith as any).title).toBe('Belle villa');
      expect((calledWith as any).owner_id).toBe('user1');
      expect((calledWith as any).created_at).toBeDefined();
      expect((calledWith as any).updated_at).toBeDefined();
    });

    it('retourne l\'ID du document créé', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'abc-xyz' });
      const id = await propertyService.createProperty({ title: 'Test' } as any);
      expect(id).toBe('abc-xyz');
    });
  });

  // ── updateProperty ──

  describe('updateProperty', () => {
    it('appelle updateDoc avec l\'ID correct et updated_at', async () => {
      await propertyService.updateProperty('prop-1', { price: 60000000 });

      expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
      const calledWith = (firestoreMocks.updateDoc.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
      expect((calledWith as any).price).toBe(60000000);
      expect((calledWith as any).updated_at).toBeDefined();
    });
  });

  // ── deleteProperty ──

  describe('deleteProperty', () => {
    it('appelle deleteDoc avec le bon document', async () => {
      await propertyService.deleteProperty('prop-to-delete');
      expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(1);
    });
  });

  // ── getProperty ──

  describe('getProperty', () => {
    it('retourne null si le document n\'existe pas', async () => {
      firestoreMocks.getDoc.mockResolvedValueOnce({
        exists: () => false,
        data: () => ({}),
        id: 'nope',
      });
      firestoreMocks.getDocs.mockResolvedValueOnce({ docs: [] } as any);

      const result = await propertyService.getProperty('inexistant');
      expect(result).toBeNull();
    });

    it('retourne une propriété valide si le document existe', async () => {
      firestoreMocks.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          owner_id: 'user1',
          title: 'Ma villa',
          property_type: 'villa',
          transaction_type: 'vente',
          price: 75000000,
          city: 'Abidjan',
          status: 'published',
          images: ['url1.jpg'],
          amenities: ['piscine'],
          created_at: Timestamp.fromDate(new Date('2026-01-01')),
          updated_at: Timestamp.fromDate(new Date('2026-01-02')),
        }),
        id: 'prop-123',
      });
      // Mock pour getDocuments (sous-collection)
      firestoreMocks.getDocs.mockResolvedValueOnce({ docs: [] } as any);

      const result = await propertyService.getProperty('prop-123');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('prop-123');
      expect(result!.title).toBe('Ma villa');
      expect(result!.price).toBe(75000000);
      expect(result!.city).toBe('Abidjan');
      expect(result!.images).toEqual(['url1.jpg']);
      expect(result!.documents).toEqual([]); // Sous-collection vide
    });
  });

  // ── Sous-collection Documents ──

  describe('setDocument', () => {
    it('appelle setDoc avec le bon chemin properties/{id}/documents/{type}', async () => {
      await propertyService.setDocument('prop-1', {
        type: 'titre_foncier',
        label: 'Titre foncier',
        url: 'https://firebasestorage.googleapis.com/doc.pdf',
        status: 'en_attente',
      });

      expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1);
      const calledWith = (firestoreMocks.setDoc.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
      expect((calledWith as any).label).toBe('Titre foncier');
      expect((calledWith as any).url).toContain('firebasestorage');
      expect((calledWith as any).status).toBe('en_attente');
    });
  });

  describe('updateDocumentStatus', () => {
    it('met à jour le statut d\'un document à "valide" dans le champ array', async () => {
      // Mock getDoc pour retourner une propriété avec un tableau documents
      firestoreMocks.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          documents: [
            { type: 'titre_foncier', label: 'Titre foncier', url: 'https://storage.com/doc.pdf', status: 'en_attente' },
            { type: 'cni', label: 'CNI', url: 'https://storage.com/cni.pdf', status: 'en_attente' },
          ],
        }),
        id: 'prop-1',
      });

      await propertyService.updateDocumentStatus('prop-1', 'titre_foncier', 'valide', {
        validated_by: 'notaire-42',
      });

      expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
      const calledWith = (firestoreMocks.updateDoc.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
      expect((calledWith as any).documents).toHaveLength(2);
      // Le titre_foncier est mis à jour
      const updatedDoc = (calledWith as any).documents.find((d: any) => d.type === 'titre_foncier');
      expect(updatedDoc.status).toBe('valide');
      expect(updatedDoc.validated_at).toBeDefined();
      expect(updatedDoc.validated_by).toBe('notaire-42');
      // Le CNI reste inchangé
      const untouchedDoc = (calledWith as any).documents.find((d: any) => d.type === 'cni');
      expect(untouchedDoc.status).toBe('en_attente');
      // updated_at est inclus
      expect((calledWith as any).updated_at).toBeDefined();
    });

    it('met à jour le statut d\'un document à "refuse" avec une raison', async () => {
      firestoreMocks.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          documents: [
            { type: 'titre_foncier', label: 'Titre foncier', url: 'https://storage.com/doc.pdf', status: 'en_attente' },
          ],
        }),
        id: 'prop-1',
      });

      await propertyService.updateDocumentStatus('prop-1', 'titre_foncier', 'refuse', {
        rejection_reason: 'Document illisible',
      });

      const calledWith = (firestoreMocks.updateDoc.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
      const updatedDoc = (calledWith as any).documents.find((d: any) => d.type === 'titre_foncier');
      expect(updatedDoc.status).toBe('refuse');
      expect(updatedDoc.rejection_reason).toBe('Document illisible');
    });

    it('ne fait rien si la propriété n\'existe pas', async () => {
      firestoreMocks.getDoc.mockResolvedValueOnce({
        exists: () => false,
        data: () => ({}),
        id: 'nope',
      });

      await propertyService.updateDocumentStatus('nope', 'titre_foncier', 'valide');

      expect(firestoreMocks.updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('deleteDocument', () => {
    it('appelle deleteDoc sur le bon chemin', async () => {
      await propertyService.deleteDocument('prop-1', 'titre_foncier');
      expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDocuments', () => {
    it('retourne un tableau vide si pas de documents', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({ docs: [] } as any);
      const docs = await propertyService.getDocuments('prop-empty');
      expect(docs).toEqual([]);
    });

    it('parse correctement les documents de la sous-collection', async () => {
      // Reset getDocs pour s'assurer que le mockResolvedValueOnce est le prochain appel
      firestoreMocks.getDocs.mockReset();
      firestoreMocks.getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'titre_foncier',
            data: () => ({
              label: 'Titre foncier',
              url: 'https://storage.com/doc.pdf',
              status: 'valide',
              validated_at: '2026-03-01',
              validated_by: 'notaire-1',
            }),
          },
          {
            id: 'permis_construire',
            data: () => ({
              label: 'Permis de construire',
              url: 'https://storage.com/permis.pdf',
              status: 'en_attente',
            }),
          },
        ],
        empty: false,
        size: 2,
      });

      const docs = await propertyService.getDocuments('prop-1');

      expect(docs).toHaveLength(2);
      expect(docs[0].type).toBe('titre_foncier');
      expect(docs[0].status).toBe('valide');
      expect(docs[0].validated_by).toBe('notaire-1');
      expect(docs[1].type).toBe('permis_construire');
      expect(docs[1].status).toBe('en_attente');
      expect(docs[1].validated_by).toBeUndefined();
    });
  });
});
