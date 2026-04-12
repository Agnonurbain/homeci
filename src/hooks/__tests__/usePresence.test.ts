/**
 * HOMECI — Tests: usePresence hook
 */
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePresence } from '../usePresence';

// Mock Firebase Firestore
const mockUpdateDoc = vi.fn(() => Promise.resolve());
const mockDoc = vi.fn(() => ({ id: 'test-doc' }));
const mockServerTimestamp = vi.fn(() => ({ __serverTimestamp: true }));

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  updateDoc: mockUpdateDoc,
  serverTimestamp: mockServerTimestamp,
  getFirestore: () => ({}),
}));

// Mock the firebase module
vi.mock('../../lib/firebase', () => ({
  db: {},
}));

describe('usePresence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should update last_seen on mount', () => {
    renderHook(() => usePresence('user123'));

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
  });

  it('should not update if userId is undefined', () => {
    renderHook(() => usePresence(undefined));

    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it('should update last_seen periodically (every 15s)', () => {
    renderHook(() => usePresence('user123'));

    // Clear initial call
    mockUpdateDoc.mockClear();

    // Advance 15 seconds
    vi.advanceTimersByTime(15000);
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

    // Advance another 15 seconds
    vi.advanceTimersByTime(15000);
    expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
  });

  it('should update on visibility change to visible', () => {
    renderHook(() => usePresence('user123'));

    mockUpdateDoc.mockClear();

    // Simulate visibility change
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
  });

  it('should not update on visibility change to hidden', () => {
    renderHook(() => usePresence('user123'));

    mockUpdateDoc.mockClear();

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it('should cleanup interval and listeners on unmount', () => {
    const { unmount } = renderHook(() => usePresence('user123'));

    mockUpdateDoc.mockClear();

    unmount();

    // Advance time - should not trigger after unmount
    vi.advanceTimersByTime(15000);
    
    // Should not have been called again after unmount
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it('should handle update errors gracefully', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockUpdateDoc.mockRejectedValueOnce(new Error('Firestore error'));

    expect(() => {
      renderHook(() => usePresence('user123'));
    }).not.toThrow();

    consoleWarn.mockRestore();
  });
});
