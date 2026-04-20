import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import {
  Zap,
  LayoutGrid01,
  Building02,
  Users01,
  CheckCircle,
  User01,
} from '@untitled-ui/icons-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WelcomeGuideProps {
  userName: string;
  onDismiss: () => void;
}

interface TourStep {
  target: string | null;
  title: string;
  description: string;
  bullets?: string[];
  icon: ReactNode;
}

// ── Step definitions ──────────────────────────────────────────────────────────

const TOUR_STEPS: TourStep[] = [
  {
    target: null,
    title: 'Welcome to AI Wealth Management',
    description: "Let's take a quick tour to show you around the key features of the platform.",
    icon: <Zap className="w-5 h-5 text-[#7F56D9]" />,
  },
  {
    target: 'tour-dashboard',
    title: 'Dashboard',
    description: 'Your home base — everything you need at a glance.',
    bullets: [
      'View task metrics and team workload',
      'Monitor overdue and pending items',
      'Quick links to key actions',
      'Filter by time range (24h, 7d, 30d)',
    ],
    icon: <LayoutGrid01 className="w-5 h-5 text-[#7F56D9]" />,
  },
  {
    target: 'tour-transcripts',
    title: 'Transcripts Flow',
    description: 'Turn meeting recordings into tasks automatically.',
    bullets: [
      'Sync transcripts from Fireflies.ai',
      'Add transcripts manually',
      'Select a firm + AI prompt to process',
      'AI extracts and creates tasks instantly',
      'Review, approve or discard each task',
    ],
    icon: <Zap className="w-5 h-5 text-[#7F56D9]" />,
  },
  {
    target: 'tour-firms',
    title: 'Firms',
    description: 'Manage all your client firms and their work.',
    bullets: [
      'Add and edit client firms',
      'Create projects inside each firm',
      'View all tasks grouped by project',
      'Track task status across the pipeline',
    ],
    icon: <Building02 className="w-5 h-5 text-[#7F56D9]" />,
  },
  {
    target: 'tour-users',
    title: 'Users & Team',
    description: 'Manage your team from one place.',
    bullets: [
      'Invite new members via email link',
      'Edit roles, skills, and job titles',
      'Resend invite links if they expire',
      'Disable or delete member accounts',
    ],
    icon: <Users01 className="w-5 h-5 text-[#7F56D9]" />,
  },
  {
    target: 'tour-profile',
    title: 'Your Profile',
    description: 'Manage your own account settings.',
    bullets: [
      'Update your name, photo, and phone',
      'Change your password anytime',
      'View your assigned role and skills',
    ],
    icon: <User01 className="w-5 h-5 text-[#7F56D9]" />,
  },
  {
    target: null,
    title: "You're all set!",
    description: 'You now know the key areas of the platform. Start by syncing a transcript or checking your dashboard.',
    icon: <CheckCircle className="w-5 h-5 text-[#7F56D9]" />,
  },
];

const TOTAL = TOUR_STEPS.length;
const CARD_HEIGHT_APPROX = 320;
const CARD_WIDTH = 300;
const CUTOUT_PADDING = 6;
const CUTOUT_RADIUS = 10;

// ── Component ─────────────────────────────────────────────────────────────────

export default function WelcomeGuide({ userName, onDismiss }: WelcomeGuideProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const current = TOUR_STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === TOTAL - 1;
  const progressPercent = ((step + 1) / TOTAL) * 100;

  // Measure the target element whenever the step changes
  useEffect(() => {
    const target = current.target;
    if (!target) { setRect(null); return; }
    const el = document.querySelector(`[data-tour="${target}"]`);
    if (el) setRect(el.getBoundingClientRect());
    else     setRect(null);
  }, [step, current.target]);

  const handleNext = useCallback(() => {
    if (isLast) onDismiss();
    else setStep((s) => s + 1);
  }, [isLast, onDismiss]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  // ── Spotlight geometry ────────────────────────────────────────────────────

  const hasTarget = rect !== null;
  const cutoutX = hasTarget ? rect!.left - CUTOUT_PADDING : 0;
  const cutoutY = hasTarget ? rect!.top  - CUTOUT_PADDING : 0;
  const cutoutW = hasTarget ? rect!.width  + CUTOUT_PADDING * 2 : 0;
  const cutoutH = hasTarget ? rect!.height + CUTOUT_PADDING * 2 : 0;

  // ── Tooltip card position ─────────────────────────────────────────────────

  let cardStyle: React.CSSProperties = {};

  if (hasTarget && rect) {
    const isRightSide = rect.left > window.innerWidth / 2;
    const cardTop = Math.min(
      Math.max(16, rect.top - 8),
      window.innerHeight - CARD_HEIGHT_APPROX - 16,
    );
    if (isRightSide) {
      cardStyle = { position: 'fixed', top: cardTop, right: window.innerWidth - rect.left + 20 };
    } else {
      cardStyle = { position: 'fixed', top: cardTop, left: rect.right + 20 };
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const card = (
    <TourCard
      step={step}
      total={TOTAL}
      current={current}
      userName={userName}
      isFirst={isFirst}
      isLast={isLast}
      progressPercent={progressPercent}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={onDismiss}
    />
  );

  const content = (
    <>
      {hasTarget ? (
        <>
          {/* Dark overlay with spotlight cutout */}
          <svg
            style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 9998, pointerEvents: 'none' }}
            aria-hidden="true"
          >
            <defs>
              <mask id="tour-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect x={cutoutX} y={cutoutY} width={cutoutW} height={cutoutH} rx={CUTOUT_RADIUS} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-mask)" />
          </svg>

          {/* Brand ring around highlighted element */}
          <svg
            style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}
            aria-hidden="true"
          >
            <rect x={cutoutX} y={cutoutY} width={cutoutW} height={cutoutH} rx={CUTOUT_RADIUS} fill="none" stroke="#7F56D9" strokeWidth="2" />
          </svg>

          {/* Tooltip card */}
          <div
            role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description"
            style={{ ...cardStyle, zIndex: 10000, width: CARD_WIDTH }}
          >
            {card}
          </div>
        </>
      ) : (
        /* Centered modal for intro / outro steps */
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50"
          style={{ zIndex: 9998 }}
          role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description"
        >
          <div style={{ width: CARD_WIDTH, zIndex: 10000 }}>{card}</div>
        </div>
      )}
    </>
  );

  return createPortal(content, document.body);
}

// ── TourCard ──────────────────────────────────────────────────────────────────

interface TourCardProps {
  step: number;
  total: number;
  current: TourStep;
  userName: string;
  isFirst: boolean;
  isLast: boolean;
  progressPercent: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

function TourCard({ step, total, current, userName, isFirst, isLast, progressPercent, onNext, onBack, onSkip }: TourCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-2xl p-5 select-none">

      {/* Top: icon + counter */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 bg-[#F4EBFF] rounded-full flex items-center justify-center shrink-0" aria-hidden="true">
          {current.icon}
        </div>
        <span className="text-[11px] text-gray-400 tabular-nums font-medium">{step + 1} / {total}</span>
      </div>

      {/* Title */}
      <h2 id="tour-title" className="text-sm font-semibold text-gray-900 mb-1">
        {isFirst ? `Hi ${userName}! ` : ''}{current.title}
      </h2>

      {/* Description */}
      <p id="tour-description" className="text-xs text-gray-500 leading-relaxed">
        {current.description}
      </p>

      {/* Bullet sub-features */}
      {current.bullets && current.bullets.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {current.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-gray-600 leading-relaxed">
              <span className="mt-[3px] w-1.5 h-1.5 rounded-full bg-[#7F56D9] shrink-0" aria-hidden="true" />
              {b}
            </li>
          ))}
        </ul>
      )}

      {/* Progress bar */}
      <div
        className="mt-4 h-1 w-full rounded-full bg-gray-100 overflow-hidden"
        role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-[#7F56D9] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Buttons */}
      <div className="mt-4 flex items-center justify-between">
        {!isLast ? (
          <button type="button" onClick={onSkip} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
            Skip tour
          </button>
        ) : <span aria-hidden="true" />}

        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              type="button" onClick={onBack}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg aria-hidden="true" width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M12.25 7H1.75M5.25 3.5 1.75 7l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
          )}
          <button
            type="button" onClick={onNext}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] text-white text-[11px] font-semibold transition-colors"
          >
            {isLast ? 'Got it' : (
              <>
                Next
                <svg aria-hidden="true" width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path d="M1.75 7h10.5M8.75 3.5 12.25 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
