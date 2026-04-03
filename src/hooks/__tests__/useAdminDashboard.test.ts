import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockFirestore } from '../../tests/firebase.mock';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminDashboard } from '../useAdminDashboard';
import { propertyService } from '../../services/propertyService';
import { delegateService } from '../../services/delegateService';

// Mock services
vi.mock('../../services/propertyService');
vi.mock('../../services/emailService');
vi.mock('../../services/delegateService');

describe('useAdminDashboard', () => {
  const mockAdmin = { id: 'admin-1', role: 'admin', full_name: 'Super Admin' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFirestore.reset();
  });

  it('charge les utilisateurs et les biens en temps réel', async () => {
    mockFirestore.setMockCollection('users', [
      { id: 'u1', data: { full_name: 'User 1', role: 'locataire', created_at: new Date().toISOString() } },
      { id: 'u2', data: { full_name: 'User 2', role: 'proprietaire', created_at: new Date().toISOString() } }
    ]);
    mockFirestore.setMockCollection('properties', [
      { id: 'p1', data: { title: 'Villa A', status: 'pending', price: 100000, created_at: new Date().toISOString() } },
      { id: 'p2', data: { title: 'Appart B', status: 'published', price: 50000, created_at: new Date().toISOString() } }
    ]);

    const { result } = renderHook(() => useAdminDashboard(mockAdmin));

    // Attendre la fin du chargement initial
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats.total_users).toBe(2);
    expect(result.current.stats.total_properties).toBe(2);
    expect(result.current.stats.pending_properties).toBe(1);
    expect(result.current.users).toHaveLength(2);
    expect(result.current.properties).toHaveLength(2);
  });

  it('filtre les utilisateurs par rôle', async () => {
    mockFirestore.setMockCollection('users', [
      { id: 'u1', data: { full_name: 'Locataire', role: 'locataire', created_at: new Date().toISOString() } },
      { id: 'u2', data: { full_name: 'Proprio', role: 'proprietaire', created_at: new Date().toISOString() } }
    ]);

    const { result } = renderHook(() => useAdminDashboard(mockAdmin));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setFilterRole('locataire');
    });

    expect(result.current.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].full_name).toBe('Locataire');
  });

  it('permet de rejeter un bien et logge l\'action', async () => {
    mockFirestore.setMockCollection('properties', [
      { id: 'p1', data: { title: 'Villa A', status: 'pending', owner_id: 'o1' } }
    ]);
    const consoleSpy = vi.spyOn(console, 'info');

    const { result } = renderHook(() => useAdminDashboard(mockAdmin));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.rejectProperty('p1');
    });

    expect(propertyService.updateProperty).toHaveBeenCalledWith('p1', { status: 'rejected' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[ADMIN_ACTION] Rejecting property: p1'));
  });

  it('consomme un jeton de délégation avec succès', async () => {
    vi.mocked(delegateService.consumeToken).mockResolvedValue({ 
      success: true, 
      message: 'Jeton validé' 
    });

    const { result } = renderHook(() => useAdminDashboard(mockAdmin));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let success;
    await act(async () => {
      success = await result.current.handleConsumeToken('HC-TOKEN-123');
    });

    expect(delegateService.consumeToken).toHaveBeenCalledWith('HC-TOKEN-123', 'admin-1');
    expect(success).toBe(true);
    expect(result.current.toast?.msg).toBe('Jeton validé');
  });
});
