import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { UserPlus01 } from '@untitled-ui/icons-react';
import MultiSelect from '../components/ui/MultiSelect';
import Input from '../components/ui/Input';
import { ROLE_OPTIONS } from '../lib/constants';
import { useCreateUser } from '../hooks/useUsers';
import { createUserSchema } from '../validations/user.validations';

type SystemRole    = 'admin' | 'member' | 'project_manager';
type RateFrequency = 'Hourly' | 'Daily' | 'Weekly' | 'Monthly';
const RATE_FREQUENCIES: RateFrequency[] = ['Hourly', 'Daily', 'Weekly', 'Monthly'];

export default function AddUserPage() {
  const navigate   = useNavigate();
  const createUser = useCreateUser();

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-2xl">

        <h1 className="text-2xl font-semibold text-[#181D27] mb-8">Invite a new user</h1>

        <Formik
          initialValues={{ email: '', role: '', rateAmount: '', rateFrequency: 'Weekly' as RateFrequency }}
          validationSchema={createUserSchema}
          onSubmit={async (values, { setFieldError, setSubmitting }) => {
            try {
              await createUser.mutateAsync({
                email:          values.email.trim(),
                role:           values.role as SystemRole,
                status:         'invited',
                rate_amount:    values.rateAmount ? parseFloat(values.rateAmount) : null,
                rate_frequency: values.rateAmount ? values.rateFrequency : null,
              });
              navigate('/users', { state: { toastMessage: 'User invited successfully' } });
            } catch (err) {
              setFieldError('email', (err as Error).message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
            <Form className="flex flex-col gap-6">

              {/* Root-level error from API */}
              {touched.email && errors.email && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {errors.email}
                </div>
              )}

              {/* Email */}
              <Input
                label="Email address"
                type="email"
                name="email"
                placeholder="user@example.com"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email && errors.email ? errors.email : undefined}
              />

              {/* Role */}
              <div>
                <MultiSelect
                  label="Role"
                  placeholder="Select role"
                  options={ROLE_OPTIONS}
                  value={values.role ? [values.role as SystemRole] : []}
                  onChange={(vals) => setFieldValue('role', vals.length > 0 ? vals[vals.length - 1] : '')}
                  columns={1}
                  singleSelect
                />
                {touched.role && errors.role && (
                  <p className="text-xs text-red-600 mt-1">{errors.role}</p>
                )}
              </div>

              {/* Rate */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
                <Input
                  label="Rate"
                  type="number"
                  name="rateAmount"
                  placeholder="500"
                  leftIcon={<span className="text-sm font-medium text-gray-400">$</span>}
                  min="0"
                  step="0.01"
                  value={values.rateAmount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.rateAmount && errors.rateAmount ? errors.rateAmount : undefined}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#414651]">Frequency</label>
                  <div className="relative">
                    <select
                      name="rateFrequency"
                      value={values.rateFrequency}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] bg-white focus:outline-none focus:ring-2 focus:ring-[#9E77ED] w-full appearance-none pr-8"
                    >
                      {RATE_FREQUENCIES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  <UserPlus01 width={18} height={18} />
                  {isSubmitting ? 'Sending invite…' : 'Send Invite'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#D5D7DA] text-[#414651] text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  Cancel
                </button>
              </div>

            </Form>
          )}
        </Formik>
      </div>
    </main>
  );
}
