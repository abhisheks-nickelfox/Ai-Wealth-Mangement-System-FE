import { Building02 } from '@untitled-ui/icons-react';
import TaskIcon from '../icons/TaskIcon';
import ProjectIcon from '../icons/ProjectIcon';

export function ScopeIcon({ scope, className }: { scope: string; className?: string }) {
  if (scope === 'firm')    return <Building02 width={16} height={16} className={className} />;
  if (scope === 'project') return <ProjectIcon width={16} height={16} className={className} />;
  return <TaskIcon width={14} height={16} className={className} />;
}

export function FileIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
