import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTenantVisits } from '../useTenantVisits';
import { propertyService } from '../../services/propertyService';
import { visitService } from '../../services/visitService';

// Mock services
vi.mock('../../services/propertyService', () => ({
  propertyService: { getFavorites: vi.fn(), getProperty: vi.fn() }
}));
vi.mock('../../services/visitService', () => ({
  visitService: { 
    listenToVisitRequestsByTenant: vi.fn(), 
    acceptCounterDate: vi.fn(),
    proposeCounterDate: vi.fn(),
    createVisitRequest: vi.fn()
  }
}));

describe('useTenantVisits', () => {
  const mockTenantId = 'tenant-1';
  const mockOnShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('charge les visites via le listener au montage', async () => {
    let snapshotCallback: any;
    vi.mocked(visitService.listenToVisitRequestsByTenant).mockImplementation((_id, cb) => {
      snapshotCallback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useTenantVisits(mockTenantId, 'Aymeric', mockOnShowToast));

    const mockVisits = [{ id: 'v1', property_id: 'p1' }];
    act(() => {
      snapshotCallback(mockVisits);
    });

    expect(result.current.visitRequests).toEqual(mockVisits);
    expect(result.current.loading).toBe(true); // encore en train de fetch les propriétés
  });

  it('accepte une contre-proposition avec succès', async () => {
    let snapshotCallback: any;
    vi.mocked(visitService.listenToVisitRequestsByTenant).mockImplementation((_id, cb) => {
      snapshotCallback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useTenantVisits(mockTenantId, 'Aymeric', mockOnShowToast));

    const mockVisit = { id: 'v1', status: 'counter_proposed', counter_date: '2026-05-01' };
    act(() => {
      snapshotCallback([mockVisit]);
    });

    vi.mocked(visitService.acceptCounterDate).mockResolvedValue(undefined as any);

    await act(async () => {
      await result.current.handleAcceptCounter(mockVisit as any);
    });

    expect(visitService.acceptCounterDate).toHaveBeenCalledWith('v1', { notify: true, acceptorName: 'Aymeric' });
    expect(mockOnShowToast).toHaveBeenCalledWith('Date acceptée avec succès', 'success');
  });
});
