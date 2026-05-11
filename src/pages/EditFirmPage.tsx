import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OnboardingStepper from '../components/onboarding/OnboardingStepper';
import Toast from '../components/ui/Toast';
import {
  STEPS,
  Step1Form,
  Step2Form,
  Step3Form,
  buildE164Phone,
} from '../components/firms/FirmStepForms';
import type { Step1State, Step2State } from '../components/firms/FirmStepForms';
import { useFirmDetail, useUpdateFirm } from '../hooks/useFirms';
import { useUsers } from '../hooks/useUsers';
import { firmsApi } from '../lib/api';

type StepId = 1 | 2 | 3;

export default function EditFirmPage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const updateFirm   = useUpdateFirm();
  const { data: users = [] }             = useUsers();
  const { data: firm, isLoading, error } = useFirmDetail(id!);

  const [step, setStep]           = useState<StepId>(1);
  const [apiError, setApiError]   = useState('');
  const [showToast, setShowToast] = useState(false);
  const [hydrated, setHydrated]   = useState(false);

  const [step1, setStep1] = useState<Step1State>({
    name:        '',
    location:    '',
    website:     '',
    logoFile:    null,
    logoPreview: null,
    description: '',
  });

  const [step2, setStep2] = useState<Step2State>({
    contactName:    '',
    contactRole:    '',
    contactEmail:   '',
    contactPhone:   '',
    contactCountry: 'US',
  });

  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);

  useEffect(() => {
    if (firm && !hydrated) {
      setStep1({
        name:        firm.name ?? '',
        location:    firm.location ?? '',
        website:     firm.website ?? '',
        logoFile:    null,
        logoPreview: firm.logo_url ?? null,
        description: firm.description ?? '',
      });
      setStep2({
        contactName:    firm.contact_name  ?? '',
        contactRole:    firm.contact_role  ?? '',
        contactEmail:   firm.contact_email ?? '',
        contactPhone:   firm.contact_phone ?? '',
        contactCountry: 'US',
      });
      setSelectedManagerId(firm.account_manager_id ?? null);
      setHydrated(true);
    }
  }, [firm, hydrated]);

  function handleStep1Submit() {
    setApiError('');
    setStep(2);
  }

  function handleStep2Submit() {
    setApiError('');
    setStep(3);
  }

  async function handleStep3Submit() {
    setApiError('');
    try {
      const e164 = step2.contactPhone
        ? buildE164Phone(step2.contactPhone, step2.contactCountry)
        : null;

      // If logo was changed to a new local file (base64), upload to S3 first
      let logoUrl: string | null = step1.logoPreview ?? null;
      if (logoUrl?.startsWith('data:')) {
        const result = await firmsApi.uploadLogo(id!, logoUrl);
        logoUrl = result.logo_url;
      }

      await updateFirm.mutateAsync({
        id: id!,
        payload: {
          name:               step1.name.trim(),
          location:           step1.location.trim()    || null,
          website:            step1.website.trim()     || null,
          description:        step1.description.trim() || null,
          logo_url:           logoUrl,
          contact_name:       step2.contactName.trim()  || null,
          contact_role:       step2.contactRole.trim()  || null,
          contact_email:      step2.contactEmail.trim() || null,
          contact_phone:      e164                      || null,
          account_manager_id: selectedManagerId         || null,
        },
      });

      setShowToast(true);
      setTimeout(() => navigate(`/firms/${id}`), 1500);
    } catch (err) {
      setApiError((err as Error).message);
    }
  }

  const isPending = updateFirm.isPending;

  if (isLoading) {
    return (
      <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#7F56D9] border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-red-500">{(error as Error).message}</p>
      </main>
    );
  }

  return (
    <>
      {showToast && (
        <Toast
          message="Firm updated successfully"
          onClose={() => setShowToast(false)}
        />
      )}
      <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50">
        <div className="py-10 px-24">

          <div className="mb-10">
            <h1 className="text-2xl font-bold text-[#181D27]">Edit Firm</h1>
            <p className="text-sm text-gray-500 mt-1">
              Update the firm profile and relationship details.
            </p>
          </div>

          <div className="flex gap-24">

            <aside className="w-92 shrink-0">
              <OnboardingStepper
                steps={STEPS}
                currentStep={step - 1}
                onStepClick={(i) => { if (i + 1 < step) setStep((i + 1) as StepId); }}
              />
            </aside>

            <section className="w-[680px] shrink-0">
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
                  submitLabel="Save Changes"
                />
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
