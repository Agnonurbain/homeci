import { useCallback, useRef } from 'react';

export function useTabNavigation(tabIds: string[], activeId: string, onSelect: (id: string) => void) {
  const containerRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = tabIds.indexOf(activeId);
    if (idx === -1) return;

    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabIds.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabIds.length) % tabIds.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabIds.length - 1;
    else return;

    e.preventDefault();
    onSelect(tabIds[next]);
    const btn = containerRef.current?.querySelector(`[data-tab-id="${tabIds[next]}"]`) as HTMLElement | null;
    btn?.focus();
  }, [tabIds, activeId, onSelect]);

  return { containerRef, handleKeyDown };
}
