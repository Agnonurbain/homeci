import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOwnerVisits } from '../useOwnerVisits';
import { visitService } from '../../services/visitService';

// Mock services
vi.mock('../../services/visitService', () => ({
  visitService: { 
    listenToVisitRequestsByOwner: vi.fn(), 
    updateVisitStatus: vi.fn(),
    proposeCounterDate: vi.fn(),
    acceptCounterDate: vi.fn()
  }
}));

// Mock propertyService
vi.mock('../../services/propertyService', () => ({
  propertyService: { updateProperty: vi.fn() }
}));

describe('useOwnerVisits', () => {
  const mockOwnerId = 'owner-1';
  const mockFlagNeedsStatusUpdate = vi.fn();
  const mockOnShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('charge les visites via le listener au montage', async () => {
    let snapshotCallback: any;
    vi.mocked(visitService.listenToVisitRequestsByOwner).mockImplementation((_id, cb) => {
      snapshotCallback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useOwnerVisits(mockOwnerId, mockFlagNeedsStatusUpdate, mockOnShowToast));

    const mockVisits = [{ id: 'v1', status: 'pending' }];
    act(() => {
      snapshotCallback(mockVisits);
    });

    expect(result.current.visits).toEqual(mockVisits);
    expect(visitService.listenToVisitRequestsByOwner).toHaveBeenCalledWith(mockOwnerId, expect.any(Function));
  });

  it('permet de répondre à une visite et affiche un toast de succès', async () => {
    let snapshotCallback: any;
    vi.mocked(visitService.listenToVisitRequestsByOwner).mockImplementation((_id, cb) => {
      snapshotCallback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useOwnerVisits(mockOwnerId, mockFlagNeedsStatusUpdate, mockOnShowToast));

    const mockVisit = { id: 'v1', status: 'pending', preferred_date: '2026-04-01' };
    act(() => {
      snapshotCallback([mockVisit]);
    });

    // Ouvrir la modale de réponse
    act(() => {
      result.current.openVisitResponse(mockVisit as any);
    });

    expect(result.current.selectedVisit).toEqual(mockVisit);

    // Accepter
    vi.mocked(visitService.updateVisitStatus).mockResolvedValue(undefined as any);
    
    await act(async () => {
      await result.current.respondToVisit('accepted');
    });

    expect(visitService.updateVisitStatus).toHaveBeenCalledWith('v1', 'accepted', undefined, { notify: true });
    expect(mockOnShowToast).toHaveBeenCalledWith('Visite acceptée', 'success');
  });
});
