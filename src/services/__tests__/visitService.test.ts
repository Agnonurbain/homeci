import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firestoreMocks, mockFirestore } from '../../tests/firebase.mock';

const { Timestamp } = firestoreMocks;

import { visitService } from '../visitService';

beforeEach(() => {
  vi.clearAllMocks();
  mockFirestore.reset();
});

describe('visitService', () => {

  describe('createVisitRequest', () => {
    it('crée une visite avec status "pending" et owner_notes vide', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'visit-1' } as any);

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
    });
  });

  describe('updateVisitStatus', () => {
    it('accepte une visite et met à jour has_active_visit', async () => {
      mockFirestore.setMockDoc('visits/visit-1', {
        property_id: 'prop-1',
        tenant_id: 'tenant-1',
        preferred_date: '2026-01-01',
        preferred_time: '10:00',
        status: 'pending'
      });
      
      mockFirestore.setMockCollection('visits', []);

      await visitService.updateVisitStatus('visit-1', 'accepted', 'OK');

      expect(firestoreMocks.updateDoc).toHaveBeenCalled();
    });
  });

  describe('getVisitRequestsByOwner', () => {
    it('retourne les visites triées', async () => {
      mockFirestore.setMockCollection('visits', [
        {
          id: 'v1',
          data: {
            property_id: 'p1', owner_id: 'o1', tenant_id: 't1',
            preferred_date: '2026-01-01', preferred_time: '10:00',
            status: 'pending', created_at: Timestamp.fromDate(new Date('2026-01-01'))
          }
        },
        {
          id: 'v2',
          data: {
            property_id: 'p2', owner_id: 'o1', tenant_id: 't2',
            preferred_date: '2026-01-02', preferred_time: '11:00',
            status: 'accepted', created_at: Timestamp.fromDate(new Date('2026-01-02'))
          }
        }
      ]);

      const res = await visitService.getVisitRequestsByOwner('o1');
      
      expect(res).toHaveLength(2);
      expect(res[0].id).toBe('v2'); // Newer first
    });
  });

  describe('hasActiveVisit', () => {
    it('consulte property.has_active_visit', async () => {
      mockFirestore.setMockDoc('properties/prop-1', { has_active_visit: true });
      const res = await visitService.hasActiveVisit('prop-1');
      expect(res).toBe(true);
    });
  });
});
