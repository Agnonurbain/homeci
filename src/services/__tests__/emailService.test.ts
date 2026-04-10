/**
 * HOMECI — Tests: emailService
 * emailService utilise la collection 'mail' (Firebase Trigger Email extension).
 * Le champ 'to' est toujours stocké en array.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firestoreMocks, mockFirestore } from '../../tests/firebase.mock';

describe('emailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFirestore.reset();
    vi.resetModules();
  });

  describe('sendEmail', () => {
    it('ajoute un document dans la collection mail', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'mail-001' });
      const { emailService } = await import('../../services/emailService');
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });
      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
      const callArgs = (firestoreMocks.addDoc.mock.calls[0][1] as Record<string, unknown>);
      // Le 'to' est toujours un array dans le doc Firestore
      expect((callArgs.to as string[])[0]).toBe('test@example.com');
      expect((callArgs.message as any).subject).toBe('Test');
    });

    it('accepte un array de destinataires', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'mail-001' });
      const { emailService } = await import('../../services/emailService');
      await emailService.sendEmail({
        to: ['a@example.com', 'b@example.com'],
        subject: 'Multi',
        html: '<p>Hi all</p>',
      });
      const callArgs = (firestoreMocks.addDoc.mock.calls[0][1] as Record<string, unknown>);
      expect((callArgs.to as string[]).length).toBe(2);
    });
  });

  describe('notifyVisitUpdate', () => {
    it('envoie un email pour une visite approuvée', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'mail-001' });
      const { emailService } = await import('../../services/emailService');
      await emailService.notifyVisitUpdate('tenant@example.com', 'Appartement Cocody', 'approved');
      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
      const callArgs = (firestoreMocks.addDoc.mock.calls[0][1] as Record<string, unknown>);
      expect((callArgs.message as any).subject).toContain('Appartement Cocody');
      expect((callArgs.message as any).subject).toContain('approuvée');
    });

    it('envoie un email pour une visite rejetée', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'mail-001' });
      const { emailService } = await import('../../services/emailService');
      await emailService.notifyVisitUpdate('tenant@example.com', 'Maison Plateau', 'rejected');
      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
    });

    it('envoie un email pour une visite complétée', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'mail-001' });
      const { emailService } = await import('../../services/emailService');
      await emailService.notifyVisitUpdate('tenant@example.com', 'Villa Riviera', 'completed');
      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('notifyPropertyApproval', () => {
    it('notifie le propriétaire de l\'approbation de son bien', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'mail-001' });
      const { emailService } = await import('../../services/emailService');
      await emailService.notifyPropertyApproval('owner@example.com', 'Studio Marcory');
      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
      const callArgs = (firestoreMocks.addDoc.mock.calls[0][1] as Record<string, unknown>);
      expect((callArgs.message as any).subject).toContain('Studio Marcory');
      expect((callArgs.message as any).subject).toContain('approuvé');
    });
  });

  describe('notifyStatusReminder', () => {
    it('rappelle le propriétaire pour un statut de visite', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'mail-001' });
      const { emailService } = await import('../../services/emailService');
      await emailService.notifyStatusReminder('owner@example.com', 'Appartement 2 pièces', '2026-04-15');
      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
      const callArgs = (firestoreMocks.addDoc.mock.calls[0][1] as Record<string, unknown>);
      expect((callArgs.message as any).subject).toContain('Appartement 2 pièces');
    });
  });
});
