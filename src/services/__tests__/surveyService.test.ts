import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firestoreMocks } from '../../tests/firebase.mock';

const { Timestamp } = firestoreMocks;

import { surveyService } from '../surveyService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('surveyService', () => {

  describe('submitSurvey', () => {
    it('crée une enquête avec les bonnes données', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'survey-1' });

      const id = await surveyService.submitSurvey({
        user_id: 'user-1',
        user_role: 'locataire',
        rating: 4,
        comment: 'Très bon service',
        trigger: 'visit_accepted',
        property_id: 'prop-1',
        property_title: 'Villa Cocody',
      });

      expect(id).toBe('survey-1');
      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
      const data = firestoreMocks.addDoc.mock.calls[0][1];
      expect(data.user_id).toBe('user-1');
      expect(data.rating).toBe(4);
      expect(data.comment).toBe('Très bon service');
      expect(data.trigger).toBe('visit_accepted');
      expect(data.property_id).toBe('prop-1');
    });
  });

  describe('hasAlreadyResponded', () => {
    it('retourne true si une enquête existe déjà', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 's1', data: () => ({}) }],
      });

      const result = await surveyService.hasAlreadyResponded('user-1', 'visit_accepted', 'prop-1');
      expect(result).toBe(true);
    });

    it('retourne false si aucune enquête', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      const result = await surveyService.hasAlreadyResponded('user-1', 'visit_accepted', 'prop-1');
      expect(result).toBe(false);
    });
  });

  describe('getSurveysByUser', () => {
    it('retourne les enquêtes de l\'utilisateur', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 's1',
            data: () => ({
              user_id: 'user-1', user_role: 'locataire',
              rating: 5, comment: 'Super',
              trigger: 'visit_accepted',
              property_id: 'p1', property_title: 'Villa',
              created_at: Timestamp.fromDate(new Date('2026-04-01')),
            }),
          },
          {
            id: 's2',
            data: () => ({
              user_id: 'user-1', user_role: 'locataire',
              rating: 3, comment: '',
              trigger: 'visit_completed',
              created_at: Timestamp.fromDate(new Date('2026-04-05')),
            }),
          },
        ],
      });

      const surveys = await surveyService.getSurveysByUser('user-1');
      expect(surveys).toHaveLength(2);
      expect(surveys[0].rating).toBe(5);
      expect(surveys[0].comment).toBe('Super');
      expect(surveys[1].rating).toBe(3);
    });
  });

  describe('getAllSurveys', () => {
    it('retourne toutes les enquêtes', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 's1',
            data: () => ({
              user_id: 'u1', user_role: 'proprietaire',
              rating: 4, comment: 'Bien',
              trigger: 'visit_accepted',
              created_at: Timestamp.fromDate(new Date('2026-04-01')),
            }),
          },
        ],
      });

      const surveys = await surveyService.getAllSurveys();
      expect(surveys).toHaveLength(1);
      expect(surveys[0].user_role).toBe('proprietaire');
    });
  });
});
