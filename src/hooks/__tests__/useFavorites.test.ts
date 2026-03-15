import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { firestoreMocks } from '../../tests/firebase.mock';

import { useFavorites } from '../useFavorites';

beforeEach(() => {
  vi.clearAllMocks();
  // Reset getDocs pour chaque test — crucial car partagé entre tests
  firestoreMocks.getDocs.mockReset();
  firestoreMocks.getDocs.mockResolvedValue({ docs: [], empty: true, size: 0 });
});

describe('useFavorites', () => {

  it('retourne un tableau vide si userId est undefined', () => {
    const { result } = renderHook(() => useFavorites(undefined));
    expect(result.current.favoriteIds).toEqual([]);
    expect(result.current.loadingFavorites).toBe(false);
  });

  it('charge les favoris depuis la sous-collection', async () => {
    firestoreMocks.getDocs.mockResolvedValueOnce({
      docs: [{ id: 'prop-1' }, { id: 'prop-2' }, { id: 'prop-3' }],
    });

    const { result } = renderHook(() => useFavorites('user-1'));

    await waitFor(() => {
      expect(result.current.favoriteIds).toEqual(['prop-1', 'prop-2', 'prop-3']);
    });
  });

  it('isFavorite retourne true pour un ID dans la liste', async () => {
    firestoreMocks.getDocs.mockResolvedValueOnce({
      docs: [{ id: 'prop-1' }, { id: 'prop-2' }],
    });

    const { result } = renderHook(() => useFavorites('user-1'));

    await waitFor(() => {
      expect(result.current.isFavorite('prop-1')).toBe(true);
      expect(result.current.isFavorite('prop-999')).toBe(false);
    });
  });

  it('ajoute un favori via toggleFavorite', async () => {
    firestoreMocks.getDocs.mockResolvedValueOnce({
      docs: [{ id: 'prop-1' }],
    });

    const { result } = renderHook(() => useFavorites('user-1'));

    await waitFor(() => {
      expect(result.current.favoriteIds).toEqual(['prop-1']);
    });

    await act(async () => {
      await result.current.toggleFavorite('prop-2');
    });

    expect(result.current.favoriteIds).toContain('prop-1');
    expect(result.current.favoriteIds).toContain('prop-2');
    expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1);
  });

  it('retire un favori via toggleFavorite', async () => {
    firestoreMocks.getDocs.mockResolvedValueOnce({
      docs: [{ id: 'prop-1' }, { id: 'prop-2' }],
    });

    const { result } = renderHook(() => useFavorites('user-1'));

    await waitFor(() => {
      expect(result.current.favoriteIds).toHaveLength(2);
    });

    await act(async () => {
      await result.current.toggleFavorite('prop-1');
    });

    expect(result.current.favoriteIds).not.toContain('prop-1');
    expect(result.current.favoriteIds).toContain('prop-2');
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(1);
  });

  it('toggleFavorite ne fait rien si userId est undefined', async () => {
    const { result } = renderHook(() => useFavorites(undefined));

    await act(async () => {
      await result.current.toggleFavorite('prop-1');
    });

    expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
    expect(firestoreMocks.deleteDoc).not.toHaveBeenCalled();
  });
});
