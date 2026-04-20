import Logo from '../Logo';
import AccountCard from '../AccountCard';
import { useAuth } from '../../context/AuthContext';

interface OnboardingLayoutProps {
  stepper: React.ReactNode;
  children: React.ReactNode;
}

export default function OnboardingLayout({ stepper, children }: OnboardingLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="h-screen bg-white overflow-hidden flex flex-row">

      {/* ── Left sidebar ────────────────────────────────────────────────── */}
      <div className="w-[300px] shrink-0 flex flex-col border-r border-gray-200">
        {/* Logo at top */}
        <div className="px-6 py-5">
          <Logo size="md" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Account card at bottom */}
        {user && (
          <div className="px-4 py-4">
            <AccountCard
              user={{
                name: user.name,
                email: user.email,
                avatar: user.avatar_url ?? undefined,
              }}
              showSelectorChevron
              showOnlineDot
            />
          </div>
        )}
      </div>

      {/* ── Right content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center overflow-y-auto px-8 pt-[10rem] pb-10" style={{ paddingRight: '18rem' }}>
        <div className="flex gap-16 w-full max-w-4xl">

          {/* Left: stepper */}
          <div className="w-[380px] shrink-0 pt-1">
            {stepper}
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200 shrink-0" />

          {/* Right: form */}
          <div className="flex-1 min-w-[360px]">
            {children}
          </div>

        </div>
      </div>

    </div>
  );
}
