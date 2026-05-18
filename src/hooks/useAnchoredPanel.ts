import { useState, useEffect } from 'react';

interface AnchoredPanelPos {
  top:      number;
  left:     number;
  maxListH: number;
}

interface UseAnchoredPanelOptions {
  width?:      number;   // dropdown width in px, default 240
  searchBarH?: number;   // height reserved for search bar, default 53
  minListH?:   number;   // minimum list height, default 60
}

export function useAnchoredPanel(
  open:      boolean,
  anchorRef: React.RefObject<HTMLElement | null>,
  opts:      UseAnchoredPanelOptions = {},
): AnchoredPanelPos | null {
  const { width = 240, searchBarH = 53, minListH = 60 } = opts;
  const [pos, setPos] = useState<AnchoredPanelPos | null>(null);

  useEffect(() => {
    if (!open) { setPos(null); return; }
    const el = anchorRef.current;
    if (!el) return;

    const rect  = el.getBoundingClientRect();
    const M = 8, G = 4;

    const left       = Math.max(M, Math.min(rect.right - width, window.innerWidth - width - M));
    const spaceBelow = window.innerHeight - rect.bottom - G - M;
    const spaceAbove = rect.top - G - M;
    const goAbove    = spaceBelow < 140 && spaceAbove > spaceBelow;
    const maxTotalH  = Math.min(320, goAbove ? spaceAbove : spaceBelow);
    const maxListH   = Math.max(minListH, maxTotalH - searchBarH);
    const top        = goAbove ? rect.top - G - maxTotalH : rect.bottom + G;

    setPos({ top, left, maxListH });
  }, [open, anchorRef, width, searchBarH, minListH]);

  return pos;
}
