import vectorLogo from '../../assets/logo/Logomark.svg';

interface AccessDeniedProps {
  message?: string;
}

export default function AccessDenied({ message }: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 select-none">
      <style>{`
        @keyframes aw-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes aw-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aw-ring-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.15; }
          50%       { transform: scale(1.18); opacity: 0.07; }
        }
        .aw-float    { animation: aw-float    3.2s ease-in-out infinite; }
        .aw-fade-up  { animation: aw-fade-up  0.55s ease-out both; }
        .aw-ring     { animation: aw-ring-pulse 3.2s ease-in-out infinite; }
      `}</style>

      {/* Animated logo with pulsing ring */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Outer pulsing ring */}
        <div className="aw-ring absolute w-36 h-36 rounded-full bg-brand-600 opacity-10" />
        {/* Inner ring */}
        <div
          className="aw-ring absolute w-24 h-24 rounded-full bg-brand-600 opacity-10"
          style={{ animationDelay: '0.4s' }}
        />
        {/* Logo */}
        <div className="aw-float relative z-10 w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border border-[#E9EAEB]">
          <img
            src={vectorLogo}
            alt="Logo"
            className="w-10 h-10 object-contain"
          />
        </div>

        {/* Lock badge */}
        <div className="absolute -bottom-2 -right-2 z-20 w-7 h-7 rounded-full bg-[#7F56D9] flex items-center justify-center shadow-md">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div className="aw-fade-up text-center" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-xl font-bold text-[#181D27] mb-2">Access Restricted</h2>
        <p className="text-sm text-[#717680] max-w-xs leading-relaxed">
          {message && message !== 'Admin access required'
            ? message
            : "You don't have permission to view this page."}
        </p>
        <p className="text-sm text-[#717680] mt-1">
          Please contact your admin to get access.
        </p>
      </div>
    </div>
  );
}
