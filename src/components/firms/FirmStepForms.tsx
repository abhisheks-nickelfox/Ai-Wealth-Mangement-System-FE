import { useState, useMemo } from 'react';
import { Check, SearchSm } from '@untitled-ui/icons-react';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import FileUpload from '../ui/FileUpload';
import PhoneInput, { buildE164Phone, getPhoneValidationError } from '../ui/PhoneInput';
import type { User } from '../../lib/api';

export { buildE164Phone };

export const STEPS = [
  { label: 'Firm details',             sublabel: 'Enter the essential details about the firm.' },
  { label: 'Add Firm Primary contact', sublabel: 'Assign a main point of contact for this firm.' },
  { label: 'Choose Account Manager',   sublabel: 'Select a manager responsible for this firm\'s relationship.' },
];

export interface Step1State {
  name: string;
  location: string;
  website: string;
  logoFile: File | null;
  logoPreview: string | null;
  description: string;
}

export interface Step2State {
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  contactCountry: string;
}

const ALLOWED_IMAGE_TYPES = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/gif'];
const MAX_DESCRIPTION_CHARS = 500;

function isValidUrl(raw: string): boolean {
  try {
    const prefixed = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    new URL(prefixed);
    return true;
  } catch {
    return false;
  }
}

// ─── Step 1 ──────────────────────────────────────────────────────────────────

interface Step1Props {
  state: Step1State;
  onChange: (patch: Partial<Step1State>) => void;
  onSubmit: () => void;
  isPending: boolean;
  error: string;
}

export function Step1Form({ state, onChange, onSubmit, isPending, error }: Step1Props) {
  const [nameError,        setNameError]        = useState('');
  const [locationError,    setLocationError]    = useState('');
  const [websiteError,     setWebsiteError]      = useState('');
  const [logoError,        setLogoError]         = useState('');
  const [descriptionError, setDescriptionError]  = useState('');

  function handleLogoFile(file: File) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setLogoError('Only SVG, PNG, JPG, or GIF files are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo must be under 2 MB.');
      return;
    }
    setLogoError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange({ logoFile: file, logoPreview: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  }

  function validate(): boolean {
    const errors = { name: '', location: '', website: '', logo: '', description: '' };

    const name = state.name.trim();
    if (!name) {
      errors.name = 'Firm name is required.';
    } else if (name.length < 2) {
      errors.name = 'Firm name must be at least 2 characters.';
    } else if (name.length > 100) {
      errors.name = 'Firm name must be 100 characters or fewer.';
    }

    if (!state.location.trim()) {
      errors.location = 'Location is required.';
    }

    const website = state.website.trim();
    if (!website) {
      errors.website = 'Firm website is required.';
    } else if (!isValidUrl(website)) {
      errors.website = 'Please enter a valid website URL (e.g. www.example.com).';
    }

    if (!state.logoPreview) {
      errors.logo = 'Please upload a firm logo.';
    }

    if (!state.description.trim()) {
      errors.description = 'Description is required.';
    } else if (state.description.length > MAX_DESCRIPTION_CHARS) {
      errors.description = `Description must be ${MAX_DESCRIPTION_CHARS} characters or fewer.`;
    }

    setNameError(errors.name);
    setLocationError(errors.location);
    setWebsiteError(errors.website);
    setLogoError(errors.logo);
    setDescriptionError(errors.description);

    return !errors.name && !errors.location && !errors.website && !errors.logo && !errors.description;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit();
  }

  const descCount = state.description.length;

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Input
        label="Firm name"
        value={state.name}
        onChange={(e) => { onChange({ name: e.target.value }); setNameError(''); }}
        placeholder="e.g. 3 Portals Wealth Partners"
        error={nameError}
        required
      />

      <Input
        label="Location"
        value={state.location}
        onChange={(e) => { onChange({ location: e.target.value }); setLocationError(''); }}
        placeholder="United States"
        error={locationError}
        required
      />

      <Input
        label="Firm website"
        value={state.website}
        onChange={(e) => { onChange({ website: e.target.value }); setWebsiteError(''); }}
        placeholder="e.g. www.3dp.com"
        error={websiteError}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#414651]">
          Firm logo <span className="text-error-500 ml-0.5">*</span>
        </label>
        {state.logoPreview ? (
          <div className="flex items-center gap-4">
            <img
              src={state.logoPreview}
              alt="Logo preview"
              className="w-16 h-16 rounded-lg object-cover border border-[#E9EAEB]"
            />
            <button
              type="button"
              onClick={() => { onChange({ logoFile: null, logoPreview: null }); setLogoError('Please upload a firm logo.'); }}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              Remove
            </button>
          </div>
        ) : (
          <FileUpload onFile={handleLogoFile} error={logoError} />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#414651]">
          Write a short description <span className="text-error-500 ml-0.5">*</span>
        </label>
        <textarea
          value={state.description}
          onChange={(e) => { onChange({ description: e.target.value }); setDescriptionError(''); }}
          rows={4}
          placeholder="Brief overview of the firm…"
          className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 resize-none placeholder:text-[#9DA4AE] text-[#181D27] ${
            descriptionError
              ? 'border-red-400 focus:ring-red-300'
              : 'border-[#D5D7DA] focus:ring-[#7F56D9]'
          }`}
        />
        <div className="flex justify-between items-center">
          {descriptionError
            ? <p className="text-xs text-red-500">{descriptionError}</p>
            : <span />
          }
          <p className={`text-xs ml-auto ${descCount > MAX_DESCRIPTION_CHARS ? 'text-red-500' : 'text-gray-400'}`}>
            {descCount}/{MAX_DESCRIPTION_CHARS}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full py-3 bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors mt-2"
      >
        {isPending ? 'Saving…' : 'Update & Continue'}
      </button>
    </div>
  );
}

// ─── Step 2 ──────────────────────────────────────────────────────────────────

interface Step2Props {
  state: Step2State;
  onChange: (patch: Partial<Step2State>) => void;
  onSubmit: () => void;
  isPending: boolean;
  error: string;
}

export function Step2Form({ state, onChange, onSubmit, isPending, error }: Step2Props) {
  const [nameError,  setNameError]  = useState('');
  const [roleError,  setRoleError]  = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  function validate(): boolean {
    const errors = { name: '', role: '', email: '', phone: '' };

    const cName = state.contactName.trim();
    if (!cName) {
      errors.name = 'Contact name is required.';
    } else if (cName.length < 2) {
      errors.name = 'Contact name must be at least 2 characters.';
    }

    if (!state.contactRole.trim()) {
      errors.role = 'Contact role is required.';
    }

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!state.contactEmail.trim()) {
      errors.email = 'Contact email is required.';
    } else if (!emailRx.test(state.contactEmail.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!state.contactPhone) {
      errors.phone = 'Contact phone is required.';
    } else {
      const phoneErr = getPhoneValidationError(state.contactPhone, state.contactCountry);
      if (phoneErr) errors.phone = phoneErr;
    }

    setNameError(errors.name);
    setRoleError(errors.role);
    setEmailError(errors.email);
    setPhoneError(errors.phone);

    return !errors.name && !errors.role && !errors.email && !errors.phone;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit();
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Input
        label="Name"
        value={state.contactName}
        onChange={(e) => { onChange({ contactName: e.target.value }); setNameError(''); }}
        placeholder="Enter contact name"
        error={nameError}
        required
      />

      <Input
        label="Role"
        value={state.contactRole}
        onChange={(e) => { onChange({ contactRole: e.target.value }); setRoleError(''); }}
        placeholder="e.g. Marketing Manager"
        error={roleError}
        required
      />

      <Input
        label="Email"
        type="email"
        value={state.contactEmail}
        onChange={(e) => { onChange({ contactEmail: e.target.value }); setEmailError(''); }}
        placeholder="e.g. name@company.com"
        error={emailError}
        required
      />

      <PhoneInput
        label="Phone"
        value={state.contactPhone}
        onChange={(v) => { onChange({ contactPhone: v }); setPhoneError(''); }}
        countryCode={state.contactCountry}
        onCountryChange={(code) => onChange({ contactCountry: code })}
        error={phoneError}
        required
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full py-3 bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors mt-2"
      >
        {isPending ? 'Saving…' : 'Update & Continue'}
      </button>
    </div>
  );
}

// ─── Step 3 ──────────────────────────────────────────────────────────────────

interface Step3Props {
  users: User[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onSubmit: () => void;
  isPending: boolean;
  error: string;
  submitLabel?: string;
}

export function Step3Form({ users, selectedId, onSelect, onSubmit, isPending, error, submitLabel }: Step3Props) {
  const [search,       setSearch]       = useState('');
  const [managerError, setManagerError] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  function handleRowClick(id: string) {
    onSelect(selectedId === id ? null : id);
    setManagerError('');
  }

  function handleSubmit() {
    if (!selectedId) {
      setManagerError('Please select an account manager.');
      return;
    }
    setManagerError('');
    onSubmit();
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#414651] mb-1.5">
          Choose Account Manager <span className="text-error-500 ml-0.5">*</span>
        </label>

        <div className="relative mb-3">
          <SearchSm
            width={16}
            height={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search account manager"
            className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-[#D5D7DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F56D9] placeholder:text-[#9DA4AE] text-[#181D27]"
          />
        </div>

        <div className={`border rounded-lg overflow-hidden max-h-72 overflow-y-auto ${managerError ? 'border-red-400' : 'border-[#E9EAEB]'}`}>
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No users found.</p>
          ) : (
            filtered.map((user) => {
              const isSelected = user.id === selectedId;
              const handle = user.email.split('@')[0];
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleRowClick(user.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[#F3F4F6] last:border-b-0
                    ${isSelected
                      ? 'bg-[#F9F5FF] border-l-2 border-l-[#7F56D9]'
                      : 'bg-white hover:bg-gray-50 border-l-2 border-l-transparent'}
                  `}
                >
                  <Avatar name={user.name} src={user.avatar_url ?? undefined} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#181D27] truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">@{handle}</p>
                  </div>
                  {isSelected && (
                    <div className="shrink-0 w-5 h-5 rounded-full bg-[#7F56D9] flex items-center justify-center">
                      <Check width={12} height={12} className="text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {managerError && (
          <p className="text-xs text-red-500 mt-1.5">{managerError}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full py-3 bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors mt-2"
      >
        {isPending ? 'Saving…' : (submitLabel ?? 'Add Client')}
      </button>
    </div>
  );
}
