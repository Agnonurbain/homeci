import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockFirestore } from '../../tests/firebase.mock';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotaireDashboard } from '../useNotaireDashboard';
import { propertyService } from '../../services/propertyService';

// Mock services
vi.mock('../../services/propertyService');
vi.mock('../../services/notificationService');
vi.mock('../../services/visitService');
vi.mock('../../services/analyticsService');

describe('useNotaireDashboard', () => {
  const mockProfile = { id: 'notary-1', full_name: 'Me Test' };
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFirestore.reset();
  });

  it('charge les dossiers initiaux et les propriétaires', async () => {
    mockFirestore.setMockCollection('properties', [
      { id: 'p1', data: { title: 'Villa A', owner_id: 'o1', status: 'pending' } }
    ]);
    mockFirestore.setMockDoc('users/o1', { full_name: 'Proprio A' });
    
    // @ts-ignore
    vi.mocked(propertyService.getDocuments).mockResolvedValue([]);

    const { result } = renderHook(() => useNotaireDashboard(mockProfile, mockShowToast));

    // Wait for async effect and loading to finish
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 2000 });

    expect(result.current.stats.disponible).toBe(1);
    expect(result.current.owners['o1'].full_name).toBe('Proprio A');
  });

  it('exige un motif pour rejeter un document (Art. 4d)', async () => {
    const { result } = renderHook(() => useNotaireDashboard(mockProfile, mockShowToast));
    
    const mockProperty = { id: 'p1', owner_id: 'o1', title: 'Villa' } as any;

    await act(async () => {
      await result.current.handleDocAction(mockProperty, 'titre_foncier', 'refuse', '');
    });

    expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('Art. 4d'), false);
    expect(propertyService.updateDocumentStatus).not.toHaveBeenCalled();
  });

  it('permet de rejeter un document avec motif', async () => {
    const { result } = renderHook(() => useNotaireDashboard(mockProfile, mockShowToast));
    
    const mockProperty = { id: 'p1', owner_id: 'o1', title: 'Villa' } as any;

    await act(async () => {
      await result.current.handleDocAction(mockProperty, 'titre_foncier', 'refuse', 'Document illisible');
    });

    expect(propertyService.updateDocumentStatus).toHaveBeenCalledWith(
      'p1', 'titre_foncier', 'refuse', expect.objectContaining({ rejection_reason: 'Document illisible' })
    );
  });
});
