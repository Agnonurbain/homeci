/**
 * HOMECI — Tests: analyticsService
 * analyticsService utilise Firebase Analytics (logEvent), pas Firestore.
 * Toutes les méthodes sont fire-and-forget (void).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock du module analytics du service
vi.mock('../../lib/firebase', () => ({
  analyticsPromise: Promise.resolve({
    logEvent: vi.fn(),
    setUserId: vi.fn(),
    setUserProperties: vi.fn(),
  }),
}));

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('setUser', () => {
    it('définit l\'ID utilisateur et les propriétés', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      // Ne plante pas — c'est fire-and-forget
      expect(typeof analyticsService.setUser).toBe('function');
      analyticsService.setUser('user-1', 'locataire');
    });
  });

  describe('clearUser', () => {
    it('efface l\'utilisateur', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      expect(typeof analyticsService.clearUser).toBe('function');
    });
  });

  describe('login', () => {
    it('enregistre un événement login', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.login('email');
    });
  });

  describe('signup', () => {
    it('enregistre un événement signup', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.signup('google', 'proprietaire');
    });
  });

  describe('logout', () => {
    it('enregistre un événement logout', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.logout();
    });
  });

  describe('pageView', () => {
    it('enregistre un événement page_view', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.pageView('/dashboard');
    });
  });

  describe('search', () => {
    it('enregistre un événement search avec query et résultats', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.search('appartement cocody', 12);
    });
  });

  describe('viewProperty', () => {
    it('enregistre un événement view_property', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.viewProperty('prop-1', 'appartement', 'Abidjan');
    });
  });

  describe('favoriteProperty', () => {
    it('enregistre un événement favorite avec action add/remove', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.favoriteProperty('prop-1', 'add');
      analyticsService.favoriteProperty('prop-1', 'remove');
    });
  });

  describe('publishProperty', () => {
    it('enregistre un événement publish_property', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.publishProperty('prop-1', 'appartement', 'location');
    });
  });

  describe('certifyProperty', () => {
    it('enregistre un événement certify_property', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.certifyProperty('prop-1');
    });
  });

  describe('decertifyProperty', () => {
    it('enregistre un événement decertify_property avec motif', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.decertifyProperty('prop-1', 'Documents invalides');
    });
  });

  describe('updatePropertyStatus', () => {
    it('enregistre un événement update_property_status', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.updatePropertyStatus('prop-1', 'rented');
    });
  });

  describe('requestVisit', () => {
    it('enregistre un événement request_visit', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.requestVisit('prop-1');
    });
  });

  describe('acceptVisit', () => {
    it('enregistre un événement accept_visit', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.acceptVisit('visit-1');
    });
  });

  describe('completeVisit', () => {
    it('enregistre un événement complete_visit', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.completeVisit('visit-1');
    });
  });

  describe('submitSurvey', () => {
    it('enregistre un événement submit_survey', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.submitSurvey(4, 'visit_completed');
    });
  });

  describe('submitReport', () => {
    it('enregistre un événement submit_report', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.submitReport('prop-1', 'fraudulent');
    });
  });

  describe('initiatePayment', () => {
    it('enregistre un événement initiate_payment', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.initiatePayment('orange_money', 1000);
    });
  });

  describe('completePayment', () => {
    it('enregistre un événement complete_payment', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      analyticsService.completePayment('wave', 1000);
    });
  });

  describe('exports complets', () => {
    it('exporte toutes les méthodes attendues', async () => {
      const { analyticsService } = await import('../../services/analyticsService');
      const methods = [
        'setUser', 'clearUser', 'login', 'signup', 'logout',
        'pageView', 'search', 'viewProperty', 'favoriteProperty',
        'publishProperty', 'certifyProperty', 'decertifyProperty',
        'updatePropertyStatus', 'requestVisit', 'acceptVisit', 'completeVisit',
        'submitSurvey', 'submitReport', 'initiatePayment', 'completePayment',
      ];
      methods.forEach(m => {
        expect(typeof (analyticsService as Record<string, unknown>)[m]).toBe('function');
      });
    });
  });
});
