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

      const data = firestoreMocks.addDoc.mock.calls[0][1] as any;
      expect(data.status).toBe('pending');
      expect(data.owner_notes).toBe('');
      expect(data.property_id).toBe('prop-1');
    });
  });

  // ── updateVisitStatus ──

  describe('updateVisitStatus', () => {
    it('accepte une visite et met à jour has_active_visit', async () => {
      firestoreMocks.getDoc.mockResolvedValueOnce({
        id: 'visit-1',
        exists: () => true,
        data: () => ({ property_id: 'prop-1', tenant_id: 'tenant-1', preferred_date: '2026-01-01', preferred_time: '10:00' }),
      });
      // checks for other active visits
      firestoreMocks.getDocs.mockResolvedValueOnce({ docs: [], empty: true, size: 0 });

      await visitService.updateVisitStatus('visit-1', 'accepted', 'OK');

      expect(firestoreMocks.updateDoc).toHaveBeenCalled();
      // One call for visit status, one for property flag
      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: 'accepted' }));
      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ has_active_visit: true }));
    });

    it('rejette une visite et met à jour has_active_visit si plus d\'autres visites', async () => {
      firestoreMocks.getDoc.mockResolvedValueOnce({
        id: 'visit-1',
        exists: () => true,
        data: () => ({ property_id: 'prop-1', tenant_id: 'tenant-1' }),
      });
      // hasOtherActive check returns empty
      firestoreMocks.getDocs.mockResolvedValueOnce({ docs: [], empty: true, size: 0 });

      await visitService.updateVisitStatus('visit-1', 'rejected');

      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ has_active_visit: false }));
    });
  });

  // ── proposeCounterDate ──

  describe('proposeCounterDate', () => {
    it('met à jour les champs counter', async () => {
      firestoreMocks.getDoc.mockResolvedValueOnce({
        id: 'visit-1',
        exists: () => true,
        data: () => ({ property_id: 'prop-1', owner_id: 'owner-1', tenant_id: 'tenant-1' }),
      });

      await visitService.proposeCounterDate('visit-1', '2026-05-01', '15:00', 'owner');

      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        status: 'counter_proposed',
        counter_date: '2026-05-01',
        counter_time: '15:00',
        counter_proposed_by: 'owner'
      }));
    });
  });

  // ── acceptCounterDate ──

  describe('acceptCounterDate', () => {
    it('accepte la contre-proposition et nettoie les champs counter', async () => {
      firestoreMocks.getDoc.mockResolvedValueOnce({
        id: 'visit-1',
        exists: () => true,
        data: () => ({
          property_id: 'prop-1',
          counter_date: '2026-05-01',
          counter_time: '15:00',
          preferred_date: '2026-01-01',
          preferred_time: '10:00'
        }),
      });

      await visitService.acceptCounterDate('visit-1');

      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        status: 'accepted',
        preferred_date: '2026-05-01',
        counter_date: null
      }));
    });
  });

  // ── getVisitRequestsByOwner ──

  describe('getVisitRequestsByOwner', () => {
    it('retourne les visites triées', async () => {
      firestoreMocks.getDocs.mockResolvedValue({
        docs: [
          {
            id: 'v1',
            data: () => ({
              property_id: 'p1', owner_id: 'o1', tenant_id: 't1',
              preferred_date: '2026-01-01', preferred_time: '10:00',
              status: 'pending', created_at: Timestamp.fromDate(new Date('2026-01-01'))
            }),
          },
          {
            id: 'v2',
            data: () => ({
              property_id: 'p2', owner_id: 'o1', tenant_id: 't2',
              preferred_date: '2026-01-02', preferred_time: '11:00',
              status: 'accepted', created_at: Timestamp.fromDate(new Date('2026-01-02'))
            }),
          }
        ],
        empty: false,
        size: 2
      });

      const res = await visitService.getVisitRequestsByOwner('o1');
      expect(res).toHaveLength(2);
      expect(res[0].id).toBe('v2'); // Newer first
    });
  });

  // ── hasActiveVisit ──

  describe('hasActiveVisit', () => {
    it('consulte property.has_active_visit', async () => {
      firestoreMocks.getDoc.mockResolvedValueOnce({
        id: 'prop-1',
        exists: () => true,
        data: () => ({ has_active_visit: true })
      });
      const res = await visitService.hasActiveVisit('prop-1');
      expect(res).toBe(true);
    });
  });
});
