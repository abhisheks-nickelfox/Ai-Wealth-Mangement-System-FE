import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:    string;
  error?:    string;
  hint?:     string;
  className?: string;
}

export default function Select({ label, error, hint, id, className = '', children, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-[#414651]">
          {label}
          {props.required && <span className="text-error-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          {...props}
          id={selectId}
          className={`
            w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-[#181D27]
            shadow-sm appearance-none pr-9 cursor-pointer
            placeholder-[#717680]
            focus:outline-none focus:ring-2 focus:ring-[#9E77ED] focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            ${error ? 'border-error-500 focus:ring-error-300' : 'border-[#D5D7DA]'}
            ${className}
          `}
        >
          {children}
        </select>

        {/* Chevron icon */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#717680]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>

      {error && <p className="text-xs text-error-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
