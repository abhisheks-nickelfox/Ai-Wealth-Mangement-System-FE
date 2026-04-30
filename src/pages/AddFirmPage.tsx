import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, SearchSm } from '@untitled-ui/icons-react';
import Input from '../components/ui/Input';
import OnboardingStepper from '../components/onboarding/OnboardingStepper';
import Avatar from '../components/ui/Avatar';
import FileUpload from '../components/ui/FileUpload';
import PhoneInput, { buildE164Phone, getPhoneValidationError } from '../components/ui/PhoneInput';
import { useCreateFirm, useUpdateFirm } from '../hooks/useFirms';
import { useUsers } from '../hooks/useUsers';
import type { User } from '../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type StepId = 1 | 2 | 3;

const STEPS = [
  { label: 'Firm details',             sublabel: 'Enter the essential details about the firm.' },
  { label: 'Add Firm Primary contact', sublabel: 'Assign a main point of contact for this firm.' },
  { label: 'Choose Account Manager',   sublabel: 'Select a manager responsible for this firm\'s relationship.' },
];

// ── Step 1: Firm Details ──────────────────────────────────────────────────────

interface Step1State {
  name: string;
  location: string;
  website: string;
  logoFile: File | null;
  logoPreview: string | null;
  description: string;
}

interface Step1Props {
  state: Step1State;
  onChange: (patch: Partial<Step1State>) => void;
  onSubmit: () => void;
  isPending: boolean;
  error: string;
}

function Step1Form({ state, onChange, onSubmit, isPending, error }: Step1Props) {
  const [nameError, setNameError] = useState('');

  function handleLogoFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange({ logoFile: file, logoPreview: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!state.name.trim()) {
      setNameError('Firm name is required.');
      return;
    }
    setNameError('');
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
        onChange={(e) => onChange({ location: e.target.value })}
        placeholder="United States"
      />

      <Input
        label="Firm website"
        value={state.website}
        onChange={(e) => onChange({ website: e.target.value })}
        placeholder="e.g. www.3dp.com"
      />

      {/* Firm logo */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#414651]">Firm logo</label>
        {state.logoPreview ? (
          <div className="flex items-center gap-4">
            <img
              src={state.logoPreview}
              alt="Logo preview"
              className="w-16 h-16 rounded-lg object-cover border border-[#E9EAEB]"
            />
            <button
              type="button"
              onClick={() => onChange({ logoFile: null, logoPreview: null })}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              Remove
            </button>
          </div>
        ) : (
          <FileUpload onFile={handleLogoFile} />
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#414651]">
          Write a short description
        </label>
        <textarea
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={4}
          placeholder="Brief overview of the firm…"
          className="w-full px-3.5 py-2.5 text-sm border border-[#D5D7DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F56D9] resize-none placeholder:text-[#9DA4AE] text-[#181D27]"
        />
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

// ── Step 2: Primary Contact ───────────────────────────────────────────────────

interface Step2State {
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  contactCountry: string;
}

interface Step2Props {
  state: Step2State;
  onChange: (patch: Partial<Step2State>) => void;
  onSubmit: () => void;
  isPending: boolean;
  error: string;
}

function Step2Form({ state, onChange, onSubmit, isPending, error }: Step2Props) {
  const [emailError, setEmailError]   = useState('');
  const [phoneError, setPhoneError]   = useState('');

  function validate(): boolean {
    let valid = true;

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (state.contactEmail && !emailRx.test(state.contactEmail)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    } else {
      setEmailError('');
    }

    if (state.contactPhone) {
      const phoneErr = getPhoneValidationError(state.contactPhone, state.contactCountry);
      if (phoneErr) {
        setPhoneError(phoneErr);
        valid = false;
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }

    return valid;
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
        onChange={(e) => onChange({ contactName: e.target.value })}
        placeholder="Enter contact name"
      />

      <Input
        label="Role"
        value={state.contactRole}
        onChange={(e) => onChange({ contactRole: e.target.value })}
        placeholder="e.g. Marketing Manager"
      />

      <Input
        label="Email"
        type="email"
        value={state.contactEmail}
        onChange={(e) => { onChange({ contactEmail: e.target.value }); setEmailError(''); }}
        placeholder="e.g. name@company.com"
        error={emailError}
      />

      <PhoneInput
        label="Phone"
        value={state.contactPhone}
        onChange={(v) => { onChange({ contactPhone: v }); setPhoneError(''); }}
        countryCode={state.contactCountry}
        onCountryChange={(code) => onChange({ contactCountry: code })}
        error={phoneError}
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

// ── Step 3: Account Manager ───────────────────────────────────────────────────

interface Step3Props {
  users: User[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onSubmit: () => void;
  isPending: boolean;
  error: string;
}

function Step3Form({ users, selectedId, onSelect, onSubmit, isPending, error }: Step3Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  function handleRowClick(id: string) {
    onSelect(selectedId === id ? null : id);
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
          Choose Account Manager
        </label>

        {/* Search */}
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
            placeholder="Choose account manager"
            className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-[#D5D7DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F56D9] placeholder:text-[#9DA4AE] text-[#181D27]"
          />
        </div>

        {/* User list */}
        <div className="border border-[#E9EAEB] rounded-lg overflow-hidden max-h-72 overflow-y-auto">
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
                  <Avatar
                    name={user.name}
                    src={user.avatar_url ?? undefined}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#181D27] truncate">
                      {user.name}
                    </p>
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
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending}
        className="w-full py-3 bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors mt-2"
      >
        {isPending ? 'Creating firm…' : 'Add Client'}
      </button>
    </div>
  );
}

// ── AddFirmPage ───────────────────────────────────────────────────────────────

export default function AddFirmPage() {
  const navigate = useNavigate();
  const createFirm = useCreateFirm();
  const updateFirm = useUpdateFirm();
  const { data: users = [] } = useUsers();

  // ── Wizard state ──────────────────────────────────────────────────────────

  const [step, setStep]       = useState<StepId>(1);
  const [firmId, setFirmId]   = useState<string | null>(null);
  const [apiError, setApiError] = useState('');

  // Step 1
  const [step1, setStep1] = useState<Step1State>({
    name:        '',
    location:    '',
    website:     '',
    logoFile:    null,
    logoPreview: null,
    description: '',
  });

  // Step 2
  const [step2, setStep2] = useState<Step2State>({
    contactName:    '',
    contactRole:    '',
    contactEmail:   '',
    contactPhone:   '',
    contactCountry: 'US',
  });

  // Step 3
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);

  // ── Step 1 submit ─────────────────────────────────────────────────────────

  async function handleStep1Submit() {
    setApiError('');
    try {
      const payload: Parameters<typeof createFirm.mutateAsync>[0] = {
        name:        step1.name.trim(),
        location:    step1.location.trim() || null,
        website:     step1.website.trim()  || null,
        description: step1.description.trim() || null,
        logo_url:    step1.logoPreview ?? null,
      };
      const firm = await createFirm.mutateAsync(payload);
      setFirmId(firm.id);
      setStep(2);
    } catch (err) {
      setApiError((err as Error).message);
    }
  }

  // ── Step 2 submit ─────────────────────────────────────────────────────────

  async function handleStep2Submit() {
    if (!firmId) return;
    setApiError('');
    try {
      const e164 = step2.contactPhone
        ? buildE164Phone(step2.contactPhone, step2.contactCountry)
        : null;

      await updateFirm.mutateAsync({
        id: firmId,
        payload: {
          contact_name:  step2.contactName.trim()  || null,
          contact_role:  step2.contactRole.trim()  || null,
          contact_email: step2.contactEmail.trim() || null,
          contact_phone: e164 || null,
        },
      });
      setStep(3);
    } catch (err) {
      setApiError((err as Error).message);
    }
  }

  // ── Step 3 submit ─────────────────────────────────────────────────────────

  async function handleStep3Submit() {
    if (!firmId) return;
    setApiError('');
    try {
      if (selectedManagerId) {
        await updateFirm.mutateAsync({
          id: firmId,
          payload: { account_manager_id: selectedManagerId },
        });
      }
      navigate(`/firms/${firmId}`);
    } catch (err) {
      setApiError((err as Error).message);
    }
  }

  const isPending = createFirm.isPending || updateFirm.isPending;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[#181D27]">Add a Firm</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new firm profile to start managing your partnership.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-8">

          {/* Left: stepper — fixed width */}
          <aside className="w-52 shrink-0">
            <OnboardingStepper
              steps={STEPS}
              currentStep={step - 1}
              onStepClick={(i) => { if (i + 1 < step) setStep((i + 1) as StepId); }}
            />
          </aside>

          {/* Right: current step form */}
          <section className="flex-1 min-w-0">
            {/* Step heading */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#181D27]">
                {STEPS[step - 1].label}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {STEPS[step - 1].sublabel}
              </p>
            </div>

            {step === 1 && (
              <Step1Form
                state={step1}
                onChange={(patch) => setStep1((s) => ({ ...s, ...patch }))}
                onSubmit={handleStep1Submit}
                isPending={isPending}
                error={apiError}
              />
            )}

            {step === 2 && (
              <Step2Form
                state={step2}
                onChange={(patch) => setStep2((s) => ({ ...s, ...patch }))}
                onSubmit={handleStep2Submit}
                isPending={isPending}
                error={apiError}
              />
            )}

            {step === 3 && (
              <Step3Form
                users={users}
                selectedId={selectedManagerId}
                onSelect={setSelectedManagerId}
                onSubmit={handleStep3Submit}
                isPending={isPending}
                error={apiError}
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
