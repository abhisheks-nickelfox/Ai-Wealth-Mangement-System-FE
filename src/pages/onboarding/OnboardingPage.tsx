import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from '@untitled-ui/icons-react';
import OnboardingLayout from '../../components/layout/OnboardingLayout';
import OnboardingStepper from '../../components/onboarding/OnboardingStepper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PhoneInput from '../../components/ui/PhoneInput';
import FileUpload from '../../components/ui/FileUpload';
import ImageCropModal from '../../components/ui/ImageCropModal';
import { onboardingApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

// ── Steps config ──────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Set your password',           sublabel: 'Create a secure password to protect your account.' },
  { label: 'Enter your Personal details', sublabel: 'Add your basic information to set up your profile.' },
  { label: 'Choose your avatar',          sublabel: 'Pick a profile image so your team can recognize you.' },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
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
  const [cropSrc,     setCropSrc]     = useState('');   // object URL for crop modal
  const [showCrop,    setShowCrop]    = useState(false);
  const [croppedUrl,  setCroppedUrl]  = useState('');   // base64 result after crop
  const [avatarUrl,   setAvatarUrl]   = useState('');   // final URL after upload
  const [uploadError, setUploadError] = useState('');
  const cropSrcRef = useRef('');                         // keep ref for cleanup

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

  // Revoke object URL on unmount
  useEffect(() => {
    return () => { if (cropSrcRef.current) URL.revokeObjectURL(cropSrcRef.current); };
  }, []);

  // Auto-redirect to login when the invite was already used
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
    if (!phoneNumber.trim()) {
      setPhoneError('Enter a valid phone number'); valid = false;
    } else if (!/^[\d\s\-().+]{7,15}$/.test(phoneNumber.trim())) {
      setPhoneError('Enter a valid phone number'); valid = false;
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

  async function handleComplete() {
    setSubmitting(true);
    setUploadError('');
    try {
      let finalAvatarUrl = avatarUrl;
      if (croppedUrl && !avatarUrl) {
        const { avatar_url } = await onboardingApi.uploadAvatar(token, croppedUrl);
        finalAvatarUrl = avatar_url;
        setAvatarUrl(avatar_url);
      }
      const result = await onboardingApi.complete({
        token,
        first_name:   firstName.trim(),
        last_name:    lastName.trim(),
        phone_number: phoneNumber.trim() || undefined,
        avatar_url:   finalAvatarUrl || undefined,
        password,
      });
      if (result?.token) {
        localStorage.setItem('mw_token', result.token);
        await refreshUser();
        setDone(true);
      } else {
        // Auto-login failed — account activated but no session returned
        navigate('/login', { replace: true });
      }
    } catch (err) {
      setUploadError((err as Error).message);
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
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
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

  // ── Stepper (shared between wizard and completion) ──────────────────────────

  const stepper = <OnboardingStepper steps={STEPS} currentStep={step} />;

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
          <Button onClick={() => navigate('/dashboard', { replace: true })}>
            Get Started
          </Button>
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
              <h1 className="text-2xl font-bold text-gray-900">Personal Details</h1>
              <p className="text-base text-gray-600 mt-2">Please enter your personal details.</p>
            </div>
            <div className="flex flex-col gap-5">
              <Input
                label="First Name"
                type="text"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setFirstNameError(''); }}
                placeholder="First name"
                error={firstNameError || undefined}
                required
              />
              <Input
                label="Last Name"
                type="text"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setLastNameError(''); }}
                placeholder="Last name"
                error={lastNameError || undefined}
                required
              />
              <PhoneInput
                label="Phone Number"
                value={phoneNumber}
                onChange={(v) => { setPhoneNumber(v); setPhoneError(''); }}
                countryCode={countryCode}
                onCountryChange={setCountryCode}
                error={phoneError || undefined}
                required
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Choose your avatar</h1>
              <p className="text-base text-gray-600 mt-2">Pick a profile image so your team can recognize you.</p>
            </div>

            {croppedUrl ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img src={croppedUrl} alt="Avatar preview" className="w-24 h-24 rounded-full object-cover border-2 border-brand-200 shadow-sm" />
                  <button
                    onClick={() => { setCroppedUrl(''); setAvatarUrl(''); }}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-error-500 text-xs"
                  >
                    ×
                  </button>
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

            <Button className="w-full justify-center" loading={submitting} onClick={handleComplete}>
              {croppedUrl ? 'Complete Setup' : 'Skip & Complete Setup'}
            </Button>
          </div>
        )}

      </OnboardingLayout>
    </>
  );
}
