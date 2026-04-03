import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast', () => {
  it('ajoute un toast et le retire manuellement', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast).toBeNull();

    act(() => {
      result.current.showToast('Message test', 'success');
    });

    expect(result.current.toast).toEqual({
      message: 'Message test',
      type: 'success'
    });

    act(() => {
      result.current.hideToast();
    });

    expect(result.current.toast).toBeNull();
  });

  it('utilise le type "info" par défaut', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Info default');
    });

    expect(result.current.toast?.type).toBe('info');
  });
});
