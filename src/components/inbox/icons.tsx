// Inbox-specific SVG icons — shapes differ from components/icons/ equivalents, do not replace.

export function FirmIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="1" y="5" width="14" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 5V3.5A1.5 1.5 0 0 1 6.5 2h3A1.5 1.5 0 0 1 11 3.5V5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M1 9h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6.5 9v2.5M9.5 9v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ProjectIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M1.5 4.5A1.5 1.5 0 0 1 3 3h3.5l1.5 2H13a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 13 14H3a1.5 1.5 0 0 1-1.5-1.5v-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function TaskIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="1.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11.5 8.5v6M8.5 11.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
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
