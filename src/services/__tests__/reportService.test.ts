import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firestoreMocks } from '../../tests/firebase.mock';

const { Timestamp } = firestoreMocks;

import { reportService } from '../reportService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('reportService', () => {

  describe('submitReport', () => {
    it('crée un signalement avec status pending', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'report-1' });

      const id = await reportService.submitReport({
        property_id: 'prop-1',
        property_title: 'Villa suspecte',
        reporter_id: 'user-1',
        reporter_role: 'locataire',
        reason: 'fraudulent',
        details: 'Prix trop bas pour être réel',
      });

      expect(id).toBe('report-1');
      const data = firestoreMocks.addDoc.mock.calls[0][1];
      expect(data.status).toBe('pending');
      expect(data.reason).toBe('fraudulent');
      expect(data.property_id).toBe('prop-1');
    });
  });

  describe('hasAlreadyReported', () => {
    it('retourne true si un signalement existe déjà', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'r1', data: () => ({}) }],
      });

      const result = await reportService.hasAlreadyReported('user-1', 'prop-1');
      expect(result).toBe(true);
    });

    it('retourne false si aucun signalement', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      const result = await reportService.hasAlreadyReported('user-1', 'prop-1');
      expect(result).toBe(false);
    });
  });

  describe('getAllReports', () => {
    it('retourne tous les signalements', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'r1',
            data: () => ({
              property_id: 'p1', property_title: 'Villa',
              reporter_id: 'u1', reporter_role: 'locataire',
              reason: 'misleading', details: 'Photos pas à jour',
              status: 'pending',
              created_at: Timestamp.fromDate(new Date('2026-04-01')),
            }),
          },
        ],
      });

      const reports = await reportService.getAllReports();
      expect(reports).toHaveLength(1);
      expect(reports[0].reason).toBe('misleading');
      expect(reports[0].status).toBe('pending');
    });
  });
});
