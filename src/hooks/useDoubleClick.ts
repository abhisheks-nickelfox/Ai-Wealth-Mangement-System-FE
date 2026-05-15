import { useRef, useCallback } from 'react';

/**
 * Returns a click handler that distinguishes single from double click.
 * First click waits `delay` ms; if a second click arrives first it's a double-click.
 * This avoids backdrop-interception issues that plague `onDoubleClick` / `e.detail` approaches.
 */
export function useDoubleClick(
  onSingle: () => void,
  onDouble: () => void,
  delay = 300,
): () => void {
  const timer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const singleRef = useRef(onSingle);
  const doubleRef = useRef(onDouble);

  // Keep refs current so stale closures never fire old callbacks
  singleRef.current = onSingle;
  doubleRef.current = onDouble;

  return useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      doubleRef.current();
    } else {
      timer.current = setTimeout(() => {
        timer.current = null;
        singleRef.current();
      }, delay);
    }
  }, [delay]);
}
