import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from '@untitled-ui/icons-react';

interface HelpTooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: number;
  className?: string;
}

interface TooltipCoords {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

export default function HelpTooltip({
  text,
  position = 'top',
  size = 14,
  className = '',
}: HelpTooltipProps) {
  const [visible, setVisible]   = useState(false);
  const [coords,  setCoords]    = useState<TooltipCoords | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const GAP = 8;

  function calculatePosition() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    // Prefer requested position; fall back to 'top' or 'bottom' if off-screen
    const wantTop = position !== 'bottom';
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: 'top' | 'bottom' =
      wantTop && spaceAbove > 60 ? 'top' :
      spaceBelow > 60            ? 'bottom' : 'top';

    const tipW  = tooltipRef.current?.offsetWidth  ?? 200;
    const tipH  = tooltipRef.current?.offsetHeight ?? 36;
    const centreX = rect.left + rect.width / 2;

    const rawLeft = centreX - tipW / 2;
    const left = Math.max(8, Math.min(rawLeft, window.innerWidth - tipW - 8));
    const top  = placement === 'top'
      ? rect.top  + window.scrollY - tipH - GAP
      : rect.bottom + window.scrollY + GAP;

    setCoords({ top, left, placement });
  }

  useEffect(() => {
    if (visible) {
      // Two-pass: first render off-screen to measure, then position
      requestAnimationFrame(calculatePosition);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const show = () => setVisible(true);
  const hide = () => { setVisible(false); setCoords(null); };

  return (
    <>
      <span
        ref={triggerRef}
        className={`relative inline-flex items-center shrink-0 cursor-pointer ${className}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
        role="button"
        aria-label="Help"
      >
        <HelpCircle
          width={size}
          height={size}
          className="text-[#7F56D9] hover:text-[#6941C6] transition-colors"
        />
      </span>

      {visible && createPortal(
        <div
          ref={tooltipRef}
          style={{
            position:  'fixed',
            top:       coords ? coords.top  : -9999,
            left:      coords ? coords.left : -9999,
            zIndex:    9999,
            pointerEvents: 'none',
          }}
          className="transition-opacity duration-150"
        >
          <div className="relative bg-[#7F56D9] text-white text-xs font-medium leading-relaxed rounded-lg px-3 py-2 shadow-lg shadow-purple-200 whitespace-nowrap">
            {text}
            {/* Arrow */}
            <span
              className={[
                'absolute left-1/2 -translate-x-1/2',
                coords?.placement === 'top'
                  ? 'top-full border-t-[#7F56D9] border-t-[6px] border-x-[6px] border-x-transparent border-b-0'
                  : 'bottom-full border-b-[#7F56D9] border-b-[6px] border-x-[6px] border-x-transparent border-t-0',
              ].join(' ')}
              style={{ width: 0, height: 0 }}
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
