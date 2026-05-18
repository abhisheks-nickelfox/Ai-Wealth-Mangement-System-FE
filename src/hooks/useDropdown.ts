import { useState, useRef } from 'react';
import { useClickOutside } from './useClickOutside';

export function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  return {
    open,
    ref,
    toggle: () => setOpen((v) => !v),
    close:  () => setOpen(false),
  };
}
