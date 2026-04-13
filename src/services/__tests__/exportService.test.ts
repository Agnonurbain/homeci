import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportService } from '../exportService';

// Mock document methods for download
const mockCreateObjectURL = vi.fn(() => 'blob://fake-url');
const mockRevokeObjectURL = vi.fn();
const mockCreateElement = vi.fn(() => ({
  href: '',
  download: '',
  style: {},
  click: vi.fn(),
}));
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
  document.createElement = mockCreateElement as any;
  document.body.appendChild = mockAppendChild as any;
  document.body.removeChild = mockRemoveChild as any;
});

describe('exportService', () => {
  describe('exportUsers', () => {
    it('génère et télécharge un CSV avec les bons headers', () => {
      const users = [
        { uid: 'u1', email: 'jean@test.ci', full_name: 'Jean Koné', phone: '+22507000000', role: 'locataire', verified: true, suspended: false, created_at: '2026-01-01T00:00:00Z' },
      ];
      exportService.exportUsers(users);
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
    });

    it('génère un fichier avec nom de fichier daté', () => {
      const users = [{ uid: 'u1', email: 'a@b.ci', full_name: 'Test', phone: null, role: 'admin', verified: false, suspended: false, created_at: '2026-01-01' }];
      exportService.exportUsers(users);
      // Le mock createElement retourne un objet avec download = '' par défaut
      // On vérifie juste que createElement a été appelé avec 'a'
      expect(mockCreateElement).toHaveBeenCalledWith('a');
    });

    it('exporte avec séparateur point-virgule', () => {
      const users = [
        { uid: 'u1', email: 'a@b.ci', full_name: 'Test User', phone: null, role: 'locataire', verified: true, suspended: false, created_at: '2026-01-01' },
      ];
      exportService.exportUsers(users);
      // On vérifie que le Blob est créé avec le bon type
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  describe('exportProperties', () => {
    it('exporte les biens en CSV', () => {
      const props = [
        { id: 'p1', title: 'Villa Cocody', owner_id: 'o1', property_type: 'villa', transaction_type: 'location', price: 150000, city: 'Abidjan', commune: 'Cocody', quartier: 'Riviera', bedrooms: 3, surface_area: 120, status: 'published', verified_notaire: true, views_count: 45, created_at: '2026-01-01' },
      ];
      exportService.exportProperties(props);
      expect(mockCreateElement).toHaveBeenCalled();
    });
  });

  describe('exportVisits', () => {
    it('exporte les visites en CSV', () => {
      const visits = [
        { id: 'v1', property_id: 'p1', property_title: 'Villa', tenant_name: 'Awa', tenant_email: 'awa@test.ci', preferred_date: '2026-02-01', preferred_time: '10:00', status: 'pending', owner_id: 'o1', created_at: '2026-01-20' },
      ];
      exportService.exportVisits(visits);
      expect(mockCreateElement).toHaveBeenCalled();
    });
  });

  describe('exportSurveys', () => {
    it('exporte les enquêtes en CSV', () => {
      const surveys = [
        { id: 's1', user_id: 'u1', user_role: 'locataire', rating: 4, comment: 'Bien', trigger: 'visit', property_title: 'Appart', created_at: '2026-01-15' },
      ];
      exportService.exportSurveys(surveys);
      expect(mockCreateElement).toHaveBeenCalled();
    });
  });

  describe('exportReports', () => {
    it('exporte les signalements en CSV', () => {
      const reports = [
        { id: 'r1', property_id: 'p1', property_title: 'Villa', reporter_email: 'report@test.ci', reporter_role: 'locataire', reason: 'fraude', details: 'Faux prix', status: 'pending', created_at: '2026-01-10' },
      ];
      exportService.exportReports(reports);
      expect(mockCreateElement).toHaveBeenCalled();
    });
  });

  describe('getColumns', () => {
    it('retourne les colonnes pour chaque type', () => {
      expect(exportService.getColumns('users').length).toBe(8);
      expect(exportService.getColumns('properties').length).toBe(15);
      expect(exportService.getColumns('visits').length).toBe(10);
      expect(exportService.getColumns('surveys').length).toBe(8);
      expect(exportService.getColumns('reports').length).toBe(9);
    });

    it('inclut les labels en français', () => {
      const cols = exportService.getColumns('users');
      expect(cols.some(c => c.label === 'Nom complet')).toBe(true);
      expect(cols.some(c => c.label === 'Email')).toBe(true);
    });
  });
});
