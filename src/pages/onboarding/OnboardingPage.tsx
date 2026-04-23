import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Plus } from '@untitled-ui/icons-react';
import OnboardingLayout from '../../components/layout/OnboardingLayout';
import OnboardingStepper from '../../components/onboarding/OnboardingStepper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PhoneInput from '../../components/ui/PhoneInput';
import FileUpload from '../../components/ui/FileUpload';
import ImageCropModal from '../../components/ui/ImageCropModal';
import { onboardingApi, skillsApi } from '../../lib/api';
import type { Skill } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { COUNTRIES } from '../../components/ui/PhoneInput';

// ── Steps config ──────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Set your password',           sublabel: 'Create a secure password to protect your account.' },
  { label: 'Enter your Personal details', sublabel: 'Add your basic information to set up your profile.' },
  { label: 'Choose your avatar',          sublabel: 'Pick a profile image so your team can recognize you.' },
  { label: 'Add skill',                   sublabel: 'Highlight your strengths and professional abilities.' },
];

const EXPERIENCE_OPTIONS = [
  '0-2 Years',
  '2-5 Years',
  '5 Years',
  '5-10 Years',
  '10+ Years',
];

// skillId = catalog ID, or '__other__' when the user wants to request a new skill
type SkillRow = { skillId: string; customName: string; experience: string };

const EMPTY_SKILL_ROW: SkillRow = { skillId: '', customName: '', experience: '' };
const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

function buildE164PhoneNumber(rawPhoneNumber: string, countryCode: string): string {
  const trimmed = rawPhoneNumber.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  }

  const selectedCountry = COUNTRIES.find((country) => country.code === countryCode) ?? COUNTRIES[0];
  const localDigits = trimmed.replace(/\D/g, '');

  return `${selectedCountry.dial}${localDigits}`;
}

function getPhoneValidationError(rawPhoneNumber: string, countryCode: string): string {
  if (!rawPhoneNumber.trim()) {
    return 'Phone number is required';
  }

  const hasInvalidCharacters = /[^\d\s\-().+]/.test(rawPhoneNumber);
  if (hasInvalidCharacters) {
    return 'Invalid characters in phone number';
  }

  const normalizedPhone = buildE164PhoneNumber(rawPhoneNumber, countryCode);
  if (!E164_PHONE_REGEX.test(normalizedPhone)) {
    return 'Phone number must be in E.164 format, e.g. +12025551234';
  }

  return '';
}

function getSkillsValidationError(skillRows: SkillRow[]): string {
  const hasAtLeastOneSkill = skillRows.some((row) => row.skillId.trim());
  if (!hasAtLeastOneSkill) {
    return 'Please add at least one skill and select experience.';
  }

  for (const row of skillRows) {
    const hasSkill = row.skillId.trim().length > 0;
    const hasExperience = row.experience.trim().length > 0;
    const needsCustomName = row.skillId === '__other__';
    const hasCustomName = row.customName.trim().length > 0;

    if (!hasSkill && !hasExperience && !hasCustomName) {
      continue;
    }

    if (!hasSkill) {
      return 'Please select a skill for every filled row.';
    }

    if (needsCustomName && !hasCustomName) {
      return 'Please describe the custom skill before continuing.';
    }

    if (!hasExperience) {
      return 'Please select experience for every skill before continuing.';
    }
  }

  return '';
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const { refreshUser } = useAuth();

  const token = searchParams.get('token') ?? '';

  // Token validation
  const [tokenLoading,  setTokenLoading]  = useState(true);
  const [tokenError,    setTokenError]    = useState('');
  const [initialName,   setInitialName]   = useState('');
  const [redirectCount, setRedirectCount] = useState(3);

  // Wizard state
  const [step,       setStep]       = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);

  // Step 1 — password
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [pwError,  setPwError]  = useState('');

  // Step 2 — personal details
  const [firstName,      setFirstName]      = useState('');
  const [lastName,       setLastName]       = useState('');
  const [phoneNumber,    setPhoneNumber]    = useState('');
  const [countryCode,    setCountryCode]    = useState('US');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError,  setLastNameError]  = useState('');
  const [phoneError,     setPhoneError]     = useState('');

  // Step 3 — avatar upload & crop
  const [cropSrc,     setCropSrc]     = useState('');
  const [showCrop,    setShowCrop]    = useState(false);
  const [croppedUrl,  setCroppedUrl]  = useState('');
  const [avatarUrl,   setAvatarUrl]   = useState('');
  const [uploadError, setUploadError] = useState('');
  const cropSrcRef = useRef('');

  // Step 4 — skills
  const [allSkills,  setAllSkills]  = useState<Skill[]>([]);
  const [skillRows,  setSkillRows]  = useState<SkillRow[]>([{ ...EMPTY_SKILL_ROW }]);
  const [skillError, setSkillError] = useState('');

  // ── Validate token on mount ─────────────────────────────────────────────────

  useEffect(() => {
    if (!token) {
      setTokenError('No invite token found. Please check your email link.');
      setTokenLoading(false);
      return;
    }
    onboardingApi
      .validate(token)
      .then(({ name: n }) => setInitialName(n))
      .catch((err: Error) => setTokenError(err.message))
      .finally(() => setTokenLoading(false));
  }, [token]);

  // Fetch available skills (public endpoint — no auth required)
  useEffect(() => {
    skillsApi.list().then(setAllSkills).catch(() => {});
  }, []);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => { if (cropSrcRef.current) URL.revokeObjectURL(cropSrcRef.current); };
  }, []);

  // Auto-redirect to login when invite already used
  const alreadyUsed = tokenError.toLowerCase().includes('already been used');
  useEffect(() => {
    if (!alreadyUsed) return;
    if (redirectCount <= 0) { navigate('/login', { replace: true }); return; }
    const t = setTimeout(() => setRedirectCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [alreadyUsed, redirectCount, navigate]);

  // ── Step handlers ───────────────────────────────────────────────────────────

  function handlePasswordNext() {
    setPwError('');
    if (password.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setPwError('Passwords do not match'); return; }
    setStep(1);
  }

  function handleDetailsNext() {
    setFirstNameError(''); setLastNameError(''); setPhoneError('');
    let valid = true;
    if (!firstName.trim()) { setFirstNameError('First name is required'); valid = false; }
    if (!lastName.trim())  { setLastNameError('Last name is required');   valid = false; }
    const phoneValidationError = getPhoneValidationError(phoneNumber, countryCode);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      valid = false;
    }
    if (!valid) return;
    setStep(2);
  }

  function handleFileSelected(file: File) {
    if (cropSrcRef.current) URL.revokeObjectURL(cropSrcRef.current);
    const objectUrl = URL.createObjectURL(file);
    cropSrcRef.current = objectUrl;
    setCropSrc(objectUrl);
    setShowCrop(true);
  }

  function handleCropSave(dataUrl: string) {
    setShowCrop(false);
    setCroppedUrl(dataUrl);
    setUploadError('');
  }

  // Skill row helpers
  function updateSkillRow(index: number, field: keyof SkillRow, value: string) {
    setSkillRows((rows) => rows.map((r, i) => i === index ? { ...r, [field]: value } : r));
    setSkillError('');
  }

  function addSkillRow() {
    setSkillRows((rows) => [...rows, { ...EMPTY_SKILL_ROW }]);
  }

  function removeSkillRow(index: number) {
    setSkillRows((rows) =>
      rows.length === 1 ? [{ ...EMPTY_SKILL_ROW }] : rows.filter((_, i) => i !== index)
    );
  }

  async function handleComplete() {
    const skillsValidationError = getSkillsValidationError(skillRows);
    if (skillsValidationError) {
      setSkillError(skillsValidationError);
      return;
    }

    setSubmitting(true);
    setSkillError('');
    setUploadError('');
    try {
      let finalAvatarUrl = avatarUrl;
      if (croppedUrl && !avatarUrl) {
        const { avatar_url } = await onboardingApi.uploadAvatar(token, croppedUrl);
        finalAvatarUrl = avatar_url;
        setAvatarUrl(avatar_url);
      }

      // Catalog skills — rows where a catalog ID was selected
      const skills = skillRows
        .filter((r) => r.skillId && r.skillId !== '__other__')
        .map((r) => ({
          skill_name: allSkills.find((s) => s.id === r.skillId)?.name ?? '',
          experience: r.experience || undefined,
        }))
        .filter((s) => s.skill_name);

      // Pending (other) skills — member typed a custom name; admin will review
      const pending_skills = skillRows
        .filter((r) => r.skillId === '__other__' && r.customName.trim())
        .map((r) => r.customName.trim());

      const result = await onboardingApi.complete({
        token,
        first_name:     firstName.trim(),
        last_name:      lastName.trim(),
        phone_number:   buildE164PhoneNumber(phoneNumber, countryCode) || undefined,
        avatar_url:     finalAvatarUrl || undefined,
        password,
        skills:         skills.length > 0 ? skills : undefined,
        pending_skills: pending_skills.length > 0 ? pending_skills : undefined,
      });

      if (result?.token) {
        localStorage.setItem('mw_token', result.token);
        await refreshUser();
        setDone(true);
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      setSkillError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading state ───────────────────────────────────────────────────────────

  if (tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Verifying your invite link…</p>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${alreadyUsed ? 'bg-success-50' : 'bg-error-50'}`}>
            {alreadyUsed ? (
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-success-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <AlertCircle width={28} height={28} className="text-error-500" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {alreadyUsed ? "You're already registered" : 'Invite link invalid'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {alreadyUsed
              ? `Your account has already been set up. Redirecting to login in ${redirectCount}s…`
              : tokenError}
          </p>
          <button onClick={() => navigate('/login', { replace: true })} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Go to login now
          </button>
        </div>
      </div>
    );
  }

  // ── Shared styles ───────────────────────────────────────────────────────────

  const dropdownCls =
    'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent appearance-none ' +
    'placeholder-gray-400';

  const chevronSvg = (
    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width={16} height={16} viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const stepper = (
    <OnboardingStepper
      steps={STEPS}
      currentStep={step}
      onStepClick={(i) => setStep(i)}
    />
  );

  // ── Completion screen ───────────────────────────────────────────────────────

  if (done) {
    const displayName = firstName || initialName;
    return (
      <OnboardingLayout stepper={<OnboardingStepper steps={STEPS} currentStep={STEPS.length} />}>
        <h1 className="text-3xl font-bold text-gray-900 whitespace-nowrap">
          Hi {displayName}, You're all set!
        </h1>
        <p className="text-base text-gray-500 mt-3" style={{ width: '466px' }}>
          Your account setup is complete. You can now start managing projects and collaborating with your team.
        </p>
        <div className="mt-8">
          <Button onClick={() => navigate('/dashboard', { replace: true })}>Get Started</Button>
        </div>
      </OnboardingLayout>
    );
  }

  // ── Main wizard ─────────────────────────────────────────────────────────────

  return (
    <>
      {showCrop && cropSrc && (
        <ImageCropModal src={cropSrc} onSave={handleCropSave} onCancel={() => setShowCrop(false)} />
      )}

      <OnboardingLayout stepper={stepper}>
        <div key={step} className="onboarding-step-enter">
        {/* ── STEP 1: Set Password ── */}
        {step === 0 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome</h1>
              <p className="text-base text-gray-600 mt-2">Please set your password</p>
            </div>
            <div className="flex flex-col gap-5">
              <Input
                label="Enter Password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwError(''); }}
                placeholder="Min. 8 characters"
                rightIcon={
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showPw ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
                  </button>
                }
              />
              <Input
                label="Confirm Password"
                type={showConf ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setPwError(''); }}
                placeholder="Re-enter your password"
                error={pwError || undefined}
                rightIcon={
                  <button type="button" onClick={() => setShowConf((v) => !v)} className="text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showConf ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
                  </button>
                }
              />
            </div>
            <Button className="w-full justify-center" onClick={handlePasswordNext}>
              Reset Password
            </Button>
          </div>
        )}

        {/* ── STEP 2: Personal Details ── */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome</h1>
              <p className="text-base text-gray-600 mt-2">Please enter your personal details.</p>
            </div>
            <div className="flex flex-col gap-5">
              <Input label="First Name" type="text" value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setFirstNameError(''); }}
                placeholder="First name" error={firstNameError || undefined} required />
              <Input label="Last Name" type="text" value={lastName}
                onChange={(e) => { setLastName(e.target.value); setLastNameError(''); }}
                placeholder="Last name" error={lastNameError || undefined} required />
              <PhoneInput
                label="Phone Number" value={phoneNumber}
                onChange={(v) => {
                  setPhoneNumber(v);
                  setPhoneError(v.trim() ? getPhoneValidationError(v, countryCode) : '');
                }}
                countryCode={countryCode} onCountryChange={(code) => {
                  setCountryCode(code);
                  setPhoneError(phoneNumber.trim() ? getPhoneValidationError(phoneNumber, code) : '');
                }}
                error={phoneError || undefined} required
              />
            </div>
            <Button className="w-full justify-center" onClick={handleDetailsNext}>
              Update &amp; Continue
            </Button>
          </div>
        )}

        {/* ── STEP 3: Choose Avatar ── */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            {croppedUrl ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img src={croppedUrl} alt="Avatar preview" className="w-24 h-24 rounded-full object-cover border-2 border-brand-200 shadow-sm" />
                  <button
                    onClick={() => { setCroppedUrl(''); setAvatarUrl(''); }}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-error-500 text-xs"
                  >×</button>
                </div>
                <p className="text-sm text-gray-500">{`${firstName} ${lastName}`.trim() || initialName}</p>
                <button onClick={() => setShowCrop(true)} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  Re-crop image
                </button>
              </div>
            ) : (
              <FileUpload onFile={handleFileSelected} error={uploadError || undefined} />
            )}
            {uploadError && !croppedUrl && <p className="text-xs text-error-600 -mt-3">{uploadError}</p>}
            <Button className="w-full justify-center" onClick={() => setStep(3)}>
              {croppedUrl ? 'Continue' : 'Skip & Continue'}
            </Button>
          </div>
        )}

        {/* ── STEP 4: Add Skills ── */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h1 className="text-2xl font-bold text-gray-900">Choose Skills</h1>

            <div className="flex flex-col gap-3">

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_1fr_36px] gap-3 items-center">
                <p className="text-sm font-medium text-[#414651] flex items-center gap-1">
                  Skills <span className="text-red-500">*</span>
                  <span title="Select or type a skill" className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 text-[10px] text-gray-500 cursor-help leading-none">?</span>
                </p>
                <p className="text-sm font-medium text-[#414651] flex items-center gap-1">
                  Experience <span className="text-red-500">*</span>
                  <span title="Years of experience" className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 text-[10px] text-gray-500 cursor-help leading-none">?</span>
                </p>
                <div />
              </div>

              {/* Skill rows */}
              {skillRows.map((row, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_36px] gap-3 items-start">

                  {/* Skill select — catalog options + custom entry */}
                  <div className="flex flex-col gap-1.5">
                    <div className="relative">
                      <select
                        value={row.skillId}
                        onChange={(e) => {
                          setSkillRows((rows) => rows.map((r, i) =>
                            i === index ? { ...r, skillId: e.target.value, customName: '' } : r
                          ));
                          setSkillError('');
                        }}
                        className={dropdownCls}
                      >
                        <option value="">Select skill</option>
                        {allSkills.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                        <option value="__other__">Other…</option>
                      </select>
                      {chevronSvg}
                    </div>
                    {row.skillId === '__other__' && (
                      <input
                        type="text"
                        value={row.customName}
                        onChange={(e) => updateSkillRow(index, 'customName', e.target.value)}
                        placeholder="Describe the skill (admin will review)"
                        className={dropdownCls}
                        autoFocus
                      />
                    )}
                  </div>

                  {/* Experience dropdown */}
                  <div className="relative">
                    <select
                      value={row.experience}
                      onChange={(e) => updateSkillRow(index, 'experience', e.target.value)}
                      className={dropdownCls}
                    >
                      <option value="">Select experience</option>
                      {EXPERIENCE_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    {chevronSvg}
                  </div>

                  {/* Remove row */}
                  <button
                    type="button"
                    onClick={() => removeSkillRow(index)}
                    className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 flex-shrink-0"
                  >
                    <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                      <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
                    </svg>
                  </button>

                </div>
              ))}

              {/* Add more link */}
              <button
                type="button"
                onClick={addSkillRow}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 mt-1 w-fit"
              >
                <Plus width={14} height={14} />
                Add more skills
              </button>

            </div>

            {skillError && <p className="text-sm text-error-600">{skillError}</p>}

            {/* Button spans only the skills + experience columns, not the remove-button column */}
            <div className="grid grid-cols-[1fr_1fr_36px] gap-3">
              <div className="col-span-2">
                <Button className="w-full justify-center" loading={submitting} onClick={handleComplete}>
                  Update &amp; Continue
                </Button>
              </div>
            </div>

          </div>
        )}
        </div>

      </OnboardingLayout>
    </>
  );
}
