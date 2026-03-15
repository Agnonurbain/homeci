import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBodyScrollLock } from '../useBodyScrollLock';

beforeEach(() => {
  // Reset body styles
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.overflow = '';
});

describe('useBodyScrollLock', () => {

  it('verrouille le body scroll quand isLocked=true', () => {
    renderHook(() => useBodyScrollLock(true));

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('ne verrouille pas quand isLocked=false', () => {
    renderHook(() => useBodyScrollLock(false));

    expect(document.body.style.position).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('déverrouille le body au démontage', () => {
    const { unmount } = renderHook(() => useBodyScrollLock(true));

    expect(document.body.style.position).toBe('fixed');

    unmount();

    expect(document.body.style.position).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('déverrouille quand isLocked passe de true à false', () => {
    const { rerender } = renderHook(
      ({ locked }) => useBodyScrollLock(locked),
      { initialProps: { locked: true } }
    );

    expect(document.body.style.position).toBe('fixed');

    rerender({ locked: false });

    expect(document.body.style.position).toBe('');
    expect(document.body.style.overflow).toBe('');
  });
});
