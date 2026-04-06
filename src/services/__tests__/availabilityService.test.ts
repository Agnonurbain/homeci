import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firestoreMocks, mockFirestore } from '../../tests/firebase.mock';

import { availabilityService } from '../availabilityService';

beforeEach(() => {
  vi.clearAllMocks();
  mockFirestore.reset();
});

describe('availabilityService', () => {
  describe('setAvailability', () => {
    it('écrase le document entier sans merge (jours désactivés supprimés)', async () => {
      await availabilityService.setAvailability({
        property_id: 'prop-1',
        owner_id: 'owner-1',
        weekly_schedule: { 1: ['09:00-12:00'], 2: ['10:00-17:00'] },
        blocked_dates: [],
      });

      expect(firestoreMocks.setDoc).toHaveBeenCalledOnce();
      const args = firestoreMocks.setDoc.mock.calls[0];
      const data = args[1];
      // Pas de 3e argument { merge: true } — le document est écrasé
      expect(args[2]).toBeUndefined();
      expect(data).toMatchObject({
        property_id: 'prop-1',
        owner_id: 'owner-1',
        weekly_schedule: { 1: ['09:00-12:00'], 2: ['10:00-17:00'] },
        blocked_dates: [],
      });
      expect(data.updated_at).toBeDefined();
    });
  });

  describe('getAvailability', () => {
    it('retourne les données si le document existe', async () => {
      mockFirestore.setMockDoc('property_availabilities/prop-1', {
        property_id: 'prop-1',
        owner_id: 'owner-1',
        weekly_schedule: { 1: ['09:00-18:00'] },
        blocked_dates: [],
        updated_at: '2026-01-01T00:00:00Z',
      });

      const result = await availabilityService.getAvailability('prop-1');
      expect(result).toMatchObject({
        property_id: 'prop-1',
        weekly_schedule: { 1: ['09:00-18:00'] },
      });
    });

    it('retourne null si le document n\'existe pas', async () => {
      const result = await availabilityService.getAvailability('inexistant');
      expect(result).toBeNull();
    });
  });

  describe('getAvailableSlots', () => {
    const availability = {
      property_id: 'prop-1',
      owner_id: 'owner-1',
      weekly_schedule: { 1: ['09:00-12:00', '14:00-18:00'] } as Record<number, string[]>,
      blocked_dates: ['2026-04-13'],
      updated_at: '2026-01-01T00:00:00Z',
    };

    it('retourne les créneaux pour un jour actif', () => {
      // 2026-04-20 is Monday (day 1), not blocked
      const monday = new Date('2026-04-20T10:00:00Z');
      const slots = availabilityService.getAvailableSlots(availability, monday);
      expect(slots).toEqual(['09:00-12:00', '14:00-18:00']);
    });

    it('retourne vide pour un jour bloqué', () => {
      const blockedDay = new Date('2026-04-13T10:00:00Z');
      const slots = availabilityService.getAvailableSlots(availability, blockedDay);
      expect(slots).toEqual([]);
    });

    it('retourne vide pour un jour non configuré', () => {
      // 2026-04-19 is Sunday (day 0)
      const sunday = new Date('2026-04-19T10:00:00Z');
      const slots = availabilityService.getAvailableSlots(availability, sunday);
      expect(slots).toEqual([]);
    });
  });
});
