import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { UserPlus01 } from '@untitled-ui/icons-react';
import MultiSelect from '../components/ui/MultiSelect';
import Input from '../components/ui/Input';
import { ROLE_OPTIONS } from '../lib/constants';
import { useCreateUser } from '../hooks/useUsers';
import { createUserSchema } from '../lib/validation/user.schemas';

type SystemRole    = 'admin' | 'member' | 'project_manager';
type RateFrequency = 'Hourly' | 'Daily' | 'Weekly' | 'Monthly';
const RATE_FREQUENCIES: RateFrequency[] = ['Hourly', 'Daily', 'Weekly', 'Monthly'];

export default function AddUserPage() {
  const navigate   = useNavigate();
  const createUser = useCreateUser();

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(createUserSchema) as any,
    defaultValues: { email: '', role: '', rateAmount: '', rateFrequency: 'Weekly' },
  });

  const onSubmit = async (data: { email: string; role: string; rateAmount: string; rateFrequency: string }) => {
    try {
      await createUser.mutateAsync({
        email:          data.email.trim(),
        role:           data.role as SystemRole,
        status:         'invited',
        rate_amount:    data.rateAmount ? parseFloat(data.rateAmount) : null,
        rate_frequency: data.rateAmount ? (data.rateFrequency as RateFrequency) : null,
      });
      navigate('/users', { state: { toastMessage: 'User invited successfully' } });
    } catch (err) {
      setError('root', { message: (err as Error).message });
    }
  };

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-2xl">

        <h1 className="text-2xl font-semibold text-[#181D27] mb-8">Invite a new user</h1>

        {errors.root && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

          {/* Email */}
          <Input
            label="Email address"
            type="email"
            placeholder="user@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          {/* Role */}
          <div>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label="Role"
                  placeholder="Select role"
                  options={ROLE_OPTIONS}
                  value={field.value ? [field.value as SystemRole] : []}
                  onChange={(vals) => field.onChange(vals.length > 0 ? vals[vals.length - 1] : '')}
                  columns={1}
                  singleSelect
                />
              )}
            />
            {errors.role && (
              <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* Rate */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
            <Input
              label="Rate"
              type="number"
              placeholder="500"
              leftIcon={<span className="text-sm font-medium text-gray-400">$</span>}
              min="0"
              step="0.01"
              error={errors.rateAmount?.message}
              {...register('rateAmount')}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#414651]">Frequency</label>
              <div className="relative">
                <select
                  {...register('rateFrequency')}
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

        </form>
      </div>
    </main>
  );
}
