import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firestoreMocks } from '../../tests/firebase.mock';

const { Timestamp } = firestoreMocks;

import { visitService } from '../visitService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('visitService', () => {

  // ── createVisitRequest ──

  describe('createVisitRequest', () => {
    it('crée une visite avec status "pending" et owner_notes vide', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'visit-1' });

      const id = await visitService.createVisitRequest({
        property_id: 'prop-1',
        property_title: 'Belle villa',
        property_city: 'Cocody',
        owner_id: 'owner-1',
        tenant_id: 'tenant-1',
        tenant_name: 'Aymeric',
        tenant_phone: '+225 07 00 00 00',
        tenant_email: 'aymeric@test.com',
        preferred_date: '2026-04-15',
        preferred_time: '10:00',
      });

      expect(id).toBe('visit-1');
      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);

      const data = firestoreMocks.addDoc.mock.calls[0][1];
      expect(data.status).toBe('pending');
      expect(data.owner_notes).toBe('');
      expect(data.property_id).toBe('prop-1');
      expect(data.tenant_name).toBe('Aymeric');
      expect(data.created_at).toBeDefined();
      expect(data.updated_at).toBeDefined();
    });
  });

  // ── updateVisitStatus ──

  describe('updateVisitStatus', () => {
    it('accepte une visite avec des notes', async () => {
      await visitService.updateVisitStatus('visit-1', 'accepted', 'RDV confirmé');

      expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
      const data = firestoreMocks.updateDoc.mock.calls[0][1];
      expect(data.status).toBe('accepted');
      expect(data.owner_notes).toBe('RDV confirmé');
    });

    it('rejette une visite sans notes', async () => {
      await visitService.updateVisitStatus('visit-2', 'rejected');

      const data = firestoreMocks.updateDoc.mock.calls[0][1];
      expect(data.status).toBe('rejected');
      expect(data.owner_notes).toBe('');
    });

    it('marque une visite comme complétée', async () => {
      await visitService.updateVisitStatus('visit-3', 'completed');

      const data = firestoreMocks.updateDoc.mock.calls[0][1];
      expect(data.status).toBe('completed');
    });
  });

  // ── proposeCounterDate ──

  describe('proposeCounterDate', () => {
    it('propose une contre-date par le propriétaire', async () => {
      await visitService.proposeCounterDate('visit-1', '2026-04-20', '14:00', 'owner');

      const data = firestoreMocks.updateDoc.mock.calls[0][1];
      expect(data.status).toBe('counter_proposed');
      expect(data.counter_date).toBe('2026-04-20');
      expect(data.counter_time).toBe('14:00');
      expect(data.counter_proposed_by).toBe('owner');
    });

    it('propose une contre-date par le locataire', async () => {
      await visitService.proposeCounterDate('visit-1', '2026-04-22', '09:00', 'tenant');

      const data = firestoreMocks.updateDoc.mock.calls[0][1];
      expect(data.counter_proposed_by).toBe('tenant');
    });
  });

  // ── acceptCounterDate ──

  describe('acceptCounterDate', () => {
    it('accepte la contre-proposition et met à jour les dates', async () => {
      firestoreMocks.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          counter_date: '2026-04-20',
          counter_time: '14:00',
          preferred_date: '2026-04-15',
          preferred_time: '10:00',
        }),
      });

      await visitService.acceptCounterDate('visit-1');

      const data = firestoreMocks.updateDoc.mock.calls[0][1];
      expect(data.status).toBe('accepted');
      expect(data.preferred_date).toBe('2026-04-20'); // Remplacé par counter
      expect(data.preferred_time).toBe('14:00');
      expect(data.counter_date).toBeNull(); // Nettoyé
      expect(data.counter_time).toBeNull();
      expect(data.counter_proposed_by).toBeNull();
    });

    it('ne fait rien si la visite n\'existe pas', async () => {
      firestoreMocks.getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      await visitService.acceptCounterDate('visit-inexistant');
      expect(firestoreMocks.updateDoc).not.toHaveBeenCalled();
    });
  });

  // ── getVisitRequestsByOwner / getVisitRequestsByTenant ──

  describe('getVisitRequestsByOwner', () => {
    it('retourne les visites triées par date décroissante', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'v1',
            data: () => ({
              property_id: 'p1', owner_id: 'owner-1', tenant_id: 't1',
              tenant_name: 'Jean', tenant_phone: '', tenant_email: '',
              preferred_date: '2026-04-10', preferred_time: '10:00',
              status: 'pending', owner_notes: '',
              created_at: Timestamp.fromDate(new Date('2026-04-01')),
              updated_at: Timestamp.fromDate(new Date('2026-04-01')),
            }),
          },
          {
            id: 'v2',
            data: () => ({
              property_id: 'p2', owner_id: 'owner-1', tenant_id: 't2',
              tenant_name: 'Paul', tenant_phone: '', tenant_email: '',
              preferred_date: '2026-04-15', preferred_time: '14:00',
              status: 'accepted', owner_notes: 'OK',
              created_at: Timestamp.fromDate(new Date('2026-04-05')),
              updated_at: Timestamp.fromDate(new Date('2026-04-05')),
            }),
          },
        ],
      });

      const visits = await visitService.getVisitRequestsByOwner('owner-1');

      expect(visits).toHaveLength(2);
      // Triées par date décroissante → v2 (04-05) avant v1 (04-01)
      expect(visits[0].id).toBe('v2');
      expect(visits[1].id).toBe('v1');
    });
  });
});
