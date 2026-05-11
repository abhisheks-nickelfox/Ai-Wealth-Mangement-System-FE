import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from '@untitled-ui/icons-react';

// ── Country list ──────────────────────────────────────────────────────────────

export interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
  /** Expected local digit count (after stripping country code) */
  localDigits: { min: number; max: number };
}

export const COUNTRIES: Country[] = [
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States', localDigits: { min: 10, max: 10 } },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom', localDigits: { min: 10, max: 10 } },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada',          localDigits: { min: 10, max: 10 } },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia',       localDigits: { min: 9,  max: 9  } },
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India',           localDigits: { min: 10, max: 10 } },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany',         localDigits: { min: 10, max: 11 } },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France',          localDigits: { min: 9,  max: 9  } },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE',             localDigits: { min: 9,  max: 9  } },
  { code: 'SG', dial: '+65',  flag: '🇸🇬', name: 'Singapore',       localDigits: { min: 8,  max: 8  } },
  { code: 'NZ', dial: '+64',  flag: '🇳🇿', name: 'New Zealand',     localDigits: { min: 8,  max: 9  } },
];

// ── Exported helpers ──────────────────────────────────────────────────────────

/** Strips non-digits from raw input and prepends the country dial code → E.164 */
export function buildE164Phone(raw: string, countryCode: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  }
  const country = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];
  return `${country.dial}${trimmed.replace(/\D/g, '')}`;
}

/** Returns an error string or '' if valid. Validates per-country digit count. */
export function getPhoneValidationError(raw: string, countryCode: string): string {
  if (!raw.trim()) return 'Phone number is required';

  if (/[^\d\s\-().+]/.test(raw)) return 'Phone number contains invalid characters';

  const country = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];
  const localDigits = raw.trim().replace(/\D/g, '');

  // If user typed the full E.164 (starts with +), strip the dial code first
  let digits = localDigits;
  if (raw.trim().startsWith('+')) {
    const dialDigits = country.dial.replace(/\D/g, '');
    if (digits.startsWith(dialDigits)) {
      digits = digits.slice(dialDigits.length);
    }
  }

  const { min, max } = country.localDigits;

  if (digits.length < min) {
    return min === max
      ? `${country.name} phone numbers must be ${min} digits (you entered ${digits.length})`
      : `${country.name} phone numbers must be ${min}–${max} digits (you entered ${digits.length})`;
  }

  if (digits.length > max) {
    return min === max
      ? `${country.name} phone numbers must be ${min} digits (you entered ${digits.length})`
      : `${country.name} phone numbers must be ${min}–${max} digits (you entered ${digits.length})`;
  }

  return '';
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  countryCode?: string;
  onCountryChange?: (code: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PhoneInput({
  label,
  value,
  onChange,
  onBlur,
  countryCode = 'US',
  onCountryChange,
  error,
  placeholder,
  required,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const selected = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  // Dynamic placeholder shows expected format for the selected country
  const { min, max } = selected.localDigits;
  const defaultPlaceholder = min === max ? `${min}-digit number` : `${min}–${max}-digit number`;

  function selectCountry(code: string) {
    onCountryChange?.(code);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#414651]">
          {label}
          {required && <span className="text-error-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative" ref={containerRef}>
        <div
          className={`
            flex w-full bg-white border rounded-lg shadow-sm overflow-hidden
            ${error ? 'border-error-300 ring-1 ring-error-300' : 'border-[#D5D7DA]'}
          `}
        >
          {/* Country selector trigger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={`Select country, currently ${selected.name}`}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-[#414651] bg-white hover:bg-gray-50 border-r border-[#D5D7DA] shrink-0 transition-colors"
          >
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="font-medium">{selected.code}</span>
            <ChevronDown width={14} height={14} className="text-gray-400" />
          </button>

          {/* Dial code prefix */}
          <span className="flex items-center pl-3 text-sm text-[#717680] shrink-0 select-none">
            {selected.dial}
          </span>

          {/* Number input */}
          <input
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
            onBlur={onBlur}
            placeholder={placeholder ?? defaultPlaceholder}
            maxLength={max}
            className="flex-1 min-w-0 px-2 py-2.5 text-base text-[#181D27] placeholder-[#717680] bg-white focus:outline-none"
          />

          {/* Error icon */}
          {error && (
            <span className="flex items-center pr-3 text-error-500 shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 5.33v2.67M8 10.67h.007M14.667 8A6.667 6.667 0 1 1 1.333 8a6.667 6.667 0 0 1 13.334 0z"
                  stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <>
            <ul className="absolute left-0 top-full mt-1 z-20 w-56 bg-white border border-[#E9EAEB] rounded-lg shadow-lg overflow-hidden py-1 max-h-52 overflow-y-auto">
              {COUNTRIES.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => selectCountry(c.code)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                      c.code === countryCode ? 'bg-brand-50 text-brand-700 font-medium' : 'text-[#414651]'
                    }`}
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="flex-1">{c.name}</span>
                    <span className="text-gray-400 text-xs">{c.dial}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

      </div>

      {error && (
        <p className="text-xs text-error-600">{error}</p>
      )}
    </div>
  );
}
