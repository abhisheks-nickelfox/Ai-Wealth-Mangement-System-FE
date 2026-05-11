import { useState, useMemo } from 'react';
import { Formik, Form } from 'formik';
import { Check, SearchSm } from '@untitled-ui/icons-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import FileUpload from '../ui/FileUpload';
import PhoneInput, { getPhoneValidationError } from '../ui/PhoneInput';
import type { User } from '../../lib/api';
import { firmStep1Schema, firmStep2Schema } from '../../validations/firm.validations';

export { buildE164Phone } from '../ui/PhoneInput';

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

// ─── Step 1 ──────────────────────────────────────────────────────────────────

interface Step1Props {
  state: Step1State;
  onChange: (patch: Partial<Step1State>) => void;
  onSubmit: () => void;
  isPending: boolean;
  error: string;
  apiNameError?: string;
}

export function Step1Form({ state, onChange, onSubmit, isPending, error, apiNameError = '' }: Step1Props) {
  const [logoError, setLogoError] = useState('');

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

  const descCount = state.description.length;

  return (
    <Formik
      initialValues={{
        name:        state.name,
        location:    state.location,
        website:     state.website,
        description: state.description,
      }}
      validationSchema={firmStep1Schema}
      onSubmit={(values) => {
        if (!state.logoPreview) {
          setLogoError('Please upload a firm logo.');
          return;
        }
        // Sync latest Formik values back to parent state before advancing
        onChange({
          name:        values.name,
          location:    values.location,
          website:     values.website,
          description: values.description,
        });
        onSubmit();
      }}
      enableReinitialize
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => {
        const displayNameError = apiNameError || (touched.name && errors.name ? errors.name : '');

        return (
          <Form className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Firm name"
              name="name"
              value={values.name}
              onChange={(e) => { handleChange(e); onChange({ name: e.target.value }); }}
              onBlur={handleBlur}
              placeholder="e.g. 3 Portals Wealth Partners"
              error={displayNameError || undefined}
              required
            />

            <Input
              label="Location"
              name="location"
              value={values.location}
              onChange={(e) => { handleChange(e); onChange({ location: e.target.value }); }}
              onBlur={handleBlur}
              placeholder="United States"
              error={touched.location && errors.location ? errors.location : undefined}
              required
            />

            <Input
              label="Firm website"
              name="website"
              value={values.website}
              onChange={(e) => { handleChange(e); onChange({ website: e.target.value }); }}
              onBlur={handleBlur}
              placeholder="e.g. www.3dp.com"
              error={touched.website && errors.website ? errors.website : undefined}
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
                Write a short description
              </label>
              <textarea
                name="description"
                value={values.description}
                onChange={(e) => { handleChange(e); onChange({ description: e.target.value }); }}
                onBlur={handleBlur}
                rows={4}
                placeholder="Brief overview of the firm…"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 resize-none placeholder:text-[#9DA4AE] text-[#181D27] ${
                  touched.description && errors.description
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-[#D5D7DA] focus:ring-[#7F56D9]'
                }`}
              />
              <div className="flex justify-between items-center">
                {touched.description && errors.description
                  ? <p className="text-xs text-red-500">{errors.description}</p>
                  : <span />
                }
                <p className={`text-xs ml-auto ${descCount > MAX_DESCRIPTION_CHARS ? 'text-red-500' : 'text-gray-400'}`}>
                  {descCount}/{MAX_DESCRIPTION_CHARS}
                </p>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center mt-2"
              loading={isPending || isSubmitting}
            >
              Update &amp; Continue
            </Button>
          </Form>
        );
      }}
    </Formik>
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
  // Phone validation is handled by PhoneInput helper — keep separate state
  const [phoneError, setPhoneError] = useState('');

  return (
    <Formik
      initialValues={{
        contactName:  state.contactName,
        contactRole:  state.contactRole,
        contactEmail: state.contactEmail,
      }}
      validationSchema={firmStep2Schema}
      onSubmit={(values, { setSubmitting }) => {
        if (!state.contactPhone) {
          setPhoneError('Phone number is required');
          setSubmitting(false);
          return;
        }
        const err = getPhoneValidationError(state.contactPhone, state.contactCountry);
        if (err) {
          setPhoneError(err);
          setSubmitting(false);
          return;
        }
        onChange({
          contactName:  values.contactName,
          contactRole:  values.contactRole,
          contactEmail: values.contactEmail,
        });
        onSubmit();
      }}
      enableReinitialize
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
        <Form className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Name"
            name="contactName"
            value={values.contactName}
            onChange={(e) => { handleChange(e); onChange({ contactName: e.target.value }); }}
            onBlur={handleBlur}
            placeholder="Enter contact name"
            error={touched.contactName && errors.contactName ? errors.contactName : undefined}
            required
          />

          <Input
            label="Role"
            name="contactRole"
            value={values.contactRole}
            onChange={(e) => { handleChange(e); onChange({ contactRole: e.target.value }); }}
            onBlur={handleBlur}
            placeholder="e.g. Marketing Manager (optional)"
            error={touched.contactRole && errors.contactRole ? errors.contactRole : undefined}
          />

          <Input
            label="Email"
            type="email"
            name="contactEmail"
            value={values.contactEmail}
            onChange={(e) => { handleChange(e); onChange({ contactEmail: e.target.value }); }}
            onBlur={handleBlur}
            placeholder="e.g. name@company.com"
            error={touched.contactEmail && errors.contactEmail ? errors.contactEmail : undefined}
            required
          />

          <PhoneInput
            label="Phone"
            value={state.contactPhone}
            onChange={(v) => { onChange({ contactPhone: v }); setPhoneError(''); }}
            countryCode={state.contactCountry}
            onCountryChange={(code) => onChange({ contactCountry: code })}
            error={phoneError || undefined}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center mt-2"
            loading={isPending || isSubmitting}
          >
            Update &amp; Continue
          </Button>
        </Form>
      )}
    </Formik>
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
          Choose Account Manager <span className="text-gray-400 text-xs font-normal ml-1">(optional)</span>
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

      </div>

      <Button
        type="button"
        variant="primary"
        className="w-full justify-center mt-2"
        loading={isPending}
        onClick={onSubmit}
      >
        {submitLabel ?? 'Add Firm'}
      </Button>
    </div>
  );
}
