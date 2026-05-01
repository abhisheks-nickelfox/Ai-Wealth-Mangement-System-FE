import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export default function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={`flex-1 min-w-0 overflow-y-auto bg-gray-50${className ? ` ${className}` : ''}`}>
      {children}
    </main>
  );
}
