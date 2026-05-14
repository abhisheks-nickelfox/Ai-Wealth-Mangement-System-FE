import Logo from './Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
  hidePanel?: boolean;
}

export default function AuthLayout({ children, hidePanel = false }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">

      {/* ── Left: dark photo panel (login only) ─────────────────────── */}
      {!hidePanel && (
        <div className="hidden md:block w-[45%] shrink-0 relative">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/30" />
          <div className="absolute bottom-8 left-8">
            <p className="text-white/70 text-xs font-medium">AI Wealth Connections</p>
          </div>
        </div>
      )}

      {/* ── Right / full-screen form panel ──────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-4 sm:px-8 py-10 overflow-y-auto min-h-screen">

        {/* Logo — in-flow above content for hidePanel pages */}
        {hidePanel && (
          <div className="mb-8 flex justify-center">
            <Logo size="lg" stacked />
          </div>
        )}

        {/* Content card */}
        <div className="w-full max-w-sm">
          {/* Logo — inline for login (non-hidePanel) */}
          {!hidePanel && (
            <div className="mb-8">
              <Logo size="lg" />
            </div>
          )}
          {children}
        </div>
      </div>

    </div>
  );
}
