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
    <div className="min-h-screen bg-white flex flex-row">

      {/* ── Left sidebar ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[300px] shrink-0 flex-col border-r border-gray-200">
        <div className="px-6 py-5">
          <Logo size="md" />
        </div>
        <div className="flex-1" />
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

      {/* ── Right content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-y-auto">

        {/* Mobile-only logo header */}
        <div className="lg:hidden flex items-center px-4 sm:px-6 py-4 border-b border-gray-100">
          <Logo size="sm" />
        </div>

        {/* Content row — stepper | divider | form (same order as original) */}
        <div className="flex-1 flex items-start justify-center overflow-y-auto
                        px-4 pt-8 pb-8
                        lg:px-8 lg:pt-[10rem] lg:pb-10 lg:pr-72">
          <div className="flex gap-16 w-full max-w-4xl">

            {/* Stepper — hidden on mobile */}
            <div className="hidden lg:block w-[380px] shrink-0 pt-1">
              {stepper}
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px bg-gray-200 shrink-0" />

            {/* Form — full width on mobile, flex-1 on desktop */}
            <div className="flex-1 min-w-0">
              {children}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
