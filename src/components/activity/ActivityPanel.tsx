import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from '@untitled-ui/icons-react';
import { ChatTab } from '../chat/ChatTab';
import ActivityTabBar from './ActivityTabBar';
import ActivityFilesTab from './ActivityFilesTab';
import ActivityNotesTab from './ActivityNotesTab';
import type { ActivityTabId } from './ActivityTabBar';

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const STORAGE_KEY = 'activity-panel-width';

function getInitialWidth(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const n = parseInt(stored, 10);
      if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
    }
  } catch {}
  return 380;
}

export interface ActivityPanelProps {
  // Context
  scope:     'project' | 'task';
  scopeId:   string;
  projectId: string | null;

  // Layout
  // 'aside'  → full-height side panel (task/project full page right column)
  // 'inline' → fixed-height div embedded inside a slide-over
  variant:  'aside' | 'inline';
  height?:  number;   // inline only, default 420

  // Header (aside only)
  title?:   string;
  onClose?: () => void;
}

export default function ActivityPanel({
  scope,
  scopeId,
  projectId,
  variant,
  height = 420,
  title,
  onClose,
}: ActivityPanelProps) {
  const [activeTab, setActiveTab] = useState<ActivityTabId>('recent');
  const [panelWidth, setPanelWidth] = useState(getInitialWidth);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = startX.current - e.clientX;
    const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
    setPanelWidth(next);
  }, []);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    setPanelWidth((w) => {
      try { localStorage.setItem(STORAGE_KEY, String(w)); } catch {}
      return w;
    });
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const onDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [panelWidth, onMouseMove, onMouseUp]);

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const isAside = variant === 'aside';

  const content = (
    <>
      {/* Header — aside only */}
      {isAside && title && (
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-[16px] font-semibold text-[#181D27]">{title}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[#717680] hover:bg-[#F9FAFB] transition-colors"
            >
              <X width={16} height={16} />
            </button>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div className="px-4 pb-3 shrink-0">
        <ActivityTabBar activeId={activeTab} onChange={setActiveTab} />
      </div>
      <div className="h-px bg-[#E9EAEB] shrink-0" />

      {/* Tab content */}
      {activeTab === 'recent' && <ChatTab scope={scope} scopeId={scopeId} projectId={projectId} />}
      {activeTab === 'files'  && <ActivityFilesTab projectId={projectId} scope={scope} scopeId={scopeId} />}
      {activeTab === 'notes'  && <ActivityNotesTab scope={scope} scopeId={scopeId} />}
    </>
  );

  if (isAside) {
    return (
      <aside
        className="shrink-0 flex flex-col border-l border-[#E9EAEB] bg-white h-full isolate relative"
        style={{ width: panelWidth }}
        aria-label="Activity panel"
      >
        {/* Drag handle */}
        <div
          onMouseDown={onDragHandleMouseDown}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#7F56D9] hover:opacity-40 transition-colors z-10"
          title="Drag to resize"
        />
        {content}
      </aside>
    );
  }

  return (
    <div className="flex flex-col" style={{ height }}>
      {content}
    </div>
  );
}
