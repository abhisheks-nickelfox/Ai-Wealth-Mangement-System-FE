import { useRef, useState } from 'react';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/**
 * Manages the pending→applied double-state pattern for filter panels.
 * pending state lives inside the panel; applied state drives the list.
 */
export function usePendingFilter<T extends Record<string, unknown>>(initial: T) {
  const initialRef = useRef(initial);
  const [applied, setApplied] = useState<T>(() => clone(initialRef.current));
  const [pending, setPending] = useState<T>(() => clone(initialRef.current));
  const [open, setOpen]       = useState(false);

  function openFilter() {
    setPending(clone(applied));
    setOpen(true);
  }

  function applyFilter() {
    setApplied(clone(pending));
    setOpen(false);
  }

  // Cancel: discard pending changes, close the panel
  function cancelFilter() {
    setPending(clone(applied));
    setOpen(false);
  }

  // Clear: reset both applied and pending to initial values, close the panel
  function clearFilter() {
    const fresh = clone(initialRef.current);
    setApplied(fresh);
    setPending(fresh);
    setOpen(false);
  }

  return {
    applied,
    pending,
    open,
    openFilter,
    applyFilter,
    cancelFilter,
    clearFilter,
    setPending,
    setOpen,
  };
}
