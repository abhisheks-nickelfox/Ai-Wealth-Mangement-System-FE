import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useCreateFirm } from '../hooks/useFirms';
import { useUsers } from '../hooks/useUsers';
import { firmsApi } from '../lib/api';

type StepId = 1 | 2 | 3;

export default function AddFirmPage() {
  const navigate     = useNavigate();
  const createFirm   = useCreateFirm();
  const { data: users = [] } = useUsers();

  const [step, setStep]             = useState<StepId>(1);
  const [apiError, setApiError]     = useState('');
  const [nameApiError, setNameApiError] = useState('');
  const [showToast, setShowToast]   = useState(false);

  const [step1, setStep1] = useState<Step1State>({
    name:        '',
    location:    '',
    address:     '',
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
    setNameApiError('');
    try {
      const e164 = step2.contactPhone
        ? buildE164Phone(step2.contactPhone, step2.contactCountry)
        : null;

      const firm = await createFirm.mutateAsync({
        name:               step1.name.trim(),
        location:           step1.location.trim()    || null,
        address:            step1.address.trim()     || null,
        website:            step1.website.trim()     || null,
        description:        step1.description.trim() || null,
        contact_name:       step2.contactName.trim()  || null,
        contact_role:       step2.contactRole.trim()  || null,
        contact_email:      step2.contactEmail.trim() || null,
        contact_phone:      e164                      || null,
        account_manager_id: selectedManagerId         || null,
      });

      // Upload logo to S3 after firm is created so we have the firm ID for the key
      if (step1.logoPreview) {
        await firmsApi.uploadLogo(firm.id, step1.logoPreview);
      }

      setShowToast(true);
      setTimeout(() => navigate(`/firms/${firm.id}`), 1500);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.toLowerCase().includes('already exists')) {
        setNameApiError(msg);
        setStep(1);
      } else {
        setApiError(msg);
      }
    }
  }

  const isPending = createFirm.isPending;

  return (
    <>
      {showToast && (
        <Toast
          message="Firm created successfully"
          onClose={() => setShowToast(false)}
        />
      )}
      <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50">
        <div className="py-10 px-24">

          <div className="mb-10">
            <h1 className="text-2xl font-bold text-[#181D27]">Add a Firm</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create a new firm profile to start managing your partnership.
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
                  onChange={(patch) => {
                    if (patch.name !== undefined) setNameApiError('');
                    setStep1((s) => ({ ...s, ...patch }));
                  }}
                  onSubmit={handleStep1Submit}
                  isPending={isPending}
                  error={apiError}
                  apiNameError={nameApiError}
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
    </>
  );
}
