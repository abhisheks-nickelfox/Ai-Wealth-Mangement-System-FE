import { useState } from 'react';
import { ChevronDown } from '@untitled-ui/icons-react';

// ── Country list (common codes) ───────────────────────────────────────────────

export interface Country {
  code: string;   // ISO 2-letter code
  dial: string;   // e.g. "+1"
  flag: string;   // emoji flag
  name: string;
}

export const COUNTRIES: Country[] = [
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States'  },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom'  },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada'          },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia'       },
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India'           },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany'         },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France'          },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE'             },
  { code: 'SG', dial: '+65',  flag: '🇸🇬', name: 'Singapore'       },
  { code: 'NZ', dial: '+64',  flag: '🇳🇿', name: 'New Zealand'     },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
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
  countryCode = 'US',
  onCountryChange,
  error,
  placeholder = 'Phone number',
  required,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);

  const selected = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

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

      <div className="relative">
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
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-[#414651] bg-white hover:bg-gray-50 border-r border-[#D5D7DA] shrink-0 transition-colors"
          >
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="font-medium">{selected.code}</span>
            <ChevronDown width={14} height={14} className="text-gray-400" />
          </button>

          {/* Number input */}
          <input
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-w-0 px-3 py-2.5 text-base text-[#181D27] placeholder-[#717680] bg-white focus:outline-none"
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
            {/* Click-away overlay */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
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
