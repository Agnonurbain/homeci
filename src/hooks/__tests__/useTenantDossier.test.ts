import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTenantDossier } from '../useTenantDossier';
import { dossierService } from '../../services/dossierService';

vi.mock('../../services/dossierService', () => ({
  dossierService: {
    calculateStats: vi.fn(),
    uploadDocument: vi.fn(),
    deleteDocument: vi.fn(),
    submitDossier: vi.fn(),
    isDossierComplete: vi.fn(),
  },
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  updateDoc: vi.fn(async () => {}),
  serverTimestamp: vi.fn(() => ({})),
  getFirestore: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}));

describe('useTenantDossier', () => {
  const mockUserId = 'user-1';
  const mockOnRefresh = vi.fn(async () => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('stats', () => {
    it('retourne les stats calculées par le service', () => {
      const mockStats = {
        progress: 50,
        completedRequired: 2,
        totalRequired: 4,
        totalOptional: 2,
        completedOptional: 0,
        isComplete: false,
        canSubmit: false,
      };
      vi.mocked(dossierService.calculateStats).mockReturnValue(mockStats);

      const { result } = renderHook(() =>
        useTenantDossier({
          userId: mockUserId,
          dossier: { pay_slip_1_url: 'url1', pay_slip_2_url: 'url2' },
          onRefresh: mockOnRefresh,
        })
      );

      expect(result.current.stats).toEqual(mockStats);
      expect(dossierService.calculateStats).toHaveBeenCalled();
    });

    it('gère un dossier undefined', () => {
      const mockStats = {
        progress: 0,
        completedRequired: 0,
        totalRequired: 4,
        totalOptional: 2,
        completedOptional: 0,
        isComplete: false,
        canSubmit: false,
      };
      vi.mocked(dossierService.calculateStats).mockReturnValue(mockStats);

      const { result } = renderHook(() =>
        useTenantDossier({
          userId: mockUserId,
          dossier: undefined,
          onRefresh: mockOnRefresh,
        })
      );

      expect(result.current.stats.progress).toBe(0);
    });
  });

  describe('uploadDocument', () => {
    it('upload un document avec succès', async () => {
      const mockStats = {
        progress: 50, completedRequired: 2, totalRequired: 4,
        totalOptional: 2, completedOptional: 0, isComplete: false, canSubmit: false,
      };
      vi.mocked(dossierService.calculateStats).mockReturnValue(mockStats);
      vi.mocked(dossierService.uploadDocument).mockResolvedValue('https://example.com/doc.pdf');
      vi.mocked(dossierService.isDossierComplete).mockReturnValue(false);

      const { result } = renderHook(() =>
        useTenantDossier({
          userId: mockUserId,
          dossier: {},
          onRefresh: mockOnRefresh,
        })
      );

      const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });

      expect(result.current.uploading['pay_slip_1']).toBeFalsy();

      await act(async () => {
        await result.current.uploadDocument('pay_slip_1', file);
      });

      expect(dossierService.uploadDocument).toHaveBeenCalledWith(mockUserId, 'pay_slip_1', file);
      expect(mockOnRefresh).toHaveBeenCalled();
      expect(result.current.success).not.toBeNull();
      expect(result.current.uploading['pay_slip_1']).toBe(false);
    });

    it('gère les erreurs d\'upload', async () => {
      const mockStats = {
        progress: 0, completedRequired: 0, totalRequired: 4,
        totalOptional: 2, completedOptional: 0, isComplete: false, canSubmit: false,
      };
      vi.mocked(dossierService.calculateStats).mockReturnValue(mockStats);
      vi.mocked(dossierService.uploadDocument).mockRejectedValue(new Error('File too large'));

      const { result } = renderHook(() =>
        useTenantDossier({
          userId: mockUserId,
          dossier: {},
          onRefresh: mockOnRefresh,
        })
      );

      const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.uploadDocument('pay_slip_1', file);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.uploading['pay_slip_1']).toBe(false);
    });
  });

  describe('deleteDocument', () => {
    it('supprime un document', async () => {
      const mockStats = {
        progress: 25, completedRequired: 1, totalRequired: 4,
        totalOptional: 2, completedOptional: 0, isComplete: false, canSubmit: false,
      };
      vi.mocked(dossierService.calculateStats).mockReturnValue(mockStats);
      vi.mocked(dossierService.deleteDocument).mockResolvedValue(undefined as any);

      const dossier = { pay_slip_1_url: 'https://example.com/doc.pdf' };
      const { result } = renderHook(() =>
        useTenantDossier({
          userId: mockUserId,
          dossier,
          onRefresh: mockOnRefresh,
        })
      );

      await act(async () => {
        await result.current.deleteDocument('pay_slip_1');
      });

      expect(dossierService.deleteDocument).toHaveBeenCalledWith(
        mockUserId,
        'pay_slip_1',
        'https://example.com/doc.pdf'
      );
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('ne fait rien si le document n\'a pas d\'URL', async () => {
      const mockStats = {
        progress: 0, completedRequired: 0, totalRequired: 4,
        totalOptional: 2, completedOptional: 0, isComplete: false, canSubmit: false,
      };
      vi.mocked(dossierService.calculateStats).mockReturnValue(mockStats);

      const { result } = renderHook(() =>
        useTenantDossier({
          userId: mockUserId,
          dossier: {},
          onRefresh: mockOnRefresh,
        })
      );

      await act(async () => {
        await result.current.deleteDocument('nonexistent');
      });

      expect(dossierService.deleteDocument).not.toHaveBeenCalled();
    });
  });

  describe('submitDossier', () => {
    it('soumet le dossier quand canSubmit est true', async () => {
      const mockStats = {
        progress: 100, completedRequired: 4, totalRequired: 4,
        totalOptional: 2, completedOptional: 0, isComplete: true, canSubmit: true,
      };
      vi.mocked(dossierService.calculateStats).mockReturnValue(mockStats);
      vi.mocked(dossierService.submitDossier).mockResolvedValue(undefined as any);

      const { result } = renderHook(() =>
        useTenantDossier({
          userId: mockUserId,
          dossier: {},
          onRefresh: mockOnRefresh,
        })
      );

      await act(async () => {
        await result.current.submitDossier();
      });

      expect(dossierService.submitDossier).toHaveBeenCalledWith(mockUserId);
      expect(mockOnRefresh).toHaveBeenCalled();
      expect(result.current.success).not.toBeNull();
    });

    it('rejette la soumission si le dossier n\'est pas complet', async () => {
      const mockStats = {
        progress: 50, completedRequired: 2, totalRequired: 4,
        totalOptional: 2, completedOptional: 0, isComplete: false, canSubmit: false,
      };
      vi.mocked(dossierService.calculateStats).mockReturnValue(mockStats);

      const { result } = renderHook(() =>
        useTenantDossier({
          userId: mockUserId,
          dossier: {},
          onRefresh: mockOnRefresh,
        })
      );

      await act(async () => {
        await result.current.submitDossier();
      });

      expect(dossierService.submitDossier).not.toHaveBeenCalled();
      expect(result.current.error).not.toBeNull();
      expect(result.current.error).toContain('n\'est pas complet');
    });

    it('gère les erreurs de soumission', async () => {
      const mockStats = {
        progress: 100, completedRequired: 4, totalRequired: 4,
        totalOptional: 2, completedOptional: 0, isComplete: true, canSubmit: true,
      };
      vi.mocked(dossierService.calculateStats).mockReturnValue(mockStats);
      vi.mocked(dossierService.submitDossier).mockRejectedValue(new Error('Network error') as any);

      const { result } = renderHook(() =>
        useTenantDossier({
          userId: mockUserId,
          dossier: {},
          onRefresh: mockOnRefresh,
        })
      );

      await act(async () => {
        await result.current.submitDossier();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.submitting).toBe(false);
    });
  });

  describe('clearError / clearSuccess', () => {
    it('efface l\'erreur après un upload échoué', async () => {
      const mockStats = {
        progress: 0, completedRequired: 0, totalRequired: 4,
        totalOptional: 2, completedOptional: 0, isComplete: false, canSubmit: false,
      };
      vi.mocked(dossierService.calculateStats).mockReturnValue(mockStats);
      vi.mocked(dossierService.uploadDocument).mockRejectedValue(new Error('Upload failed'));

      const { result } = renderHook(() =>
        useTenantDossier({
          userId: mockUserId,
          dossier: {},
          onRefresh: mockOnRefresh,
        })
      );

      const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.uploadDocument('pay_slip_1', file);
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('efface le message de succès après un upload réussi', async () => {
      const mockStats = {
        progress: 0, completedRequired: 0, totalRequired: 4,
        totalOptional: 2, completedOptional: 0, isComplete: false, canSubmit: false,
      };
      vi.mocked(dossierService.calculateStats).mockReturnValue(mockStats);
      vi.mocked(dossierService.uploadDocument).mockResolvedValue('https://example.com/doc.pdf');
      vi.mocked(dossierService.isDossierComplete).mockReturnValue(false);

      const { result } = renderHook(() =>
        useTenantDossier({
          userId: mockUserId,
          dossier: {},
          onRefresh: mockOnRefresh,
        })
      );

      const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.uploadDocument('pay_slip_1', file);
      });

      expect(result.current.success).not.toBeNull();

      act(() => {
        result.current.clearSuccess();
      });

      expect(result.current.success).toBeNull();
    });
  });
});
