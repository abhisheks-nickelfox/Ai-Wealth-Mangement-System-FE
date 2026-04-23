import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus01 } from '@untitled-ui/icons-react';
import MultiSelect from '../components/ui/MultiSelect';
import Input from '../components/ui/Input';
import { ROLE_OPTIONS } from '../lib/constants';
import { useCreateUser } from '../hooks/useUsers';

type SystemRole = 'admin' | 'member' | 'project_manager';
type RateFrequency = 'Hourly' | 'Daily' | 'Weekly' | 'Monthly';
const RATE_FREQUENCIES: RateFrequency[] = ['Hourly', 'Daily', 'Weekly', 'Monthly'];

// ── AddUserPage ───────────────────────────────────────────────────────────────

export default function AddUserPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [rateAmount, setRateAmount] = useState('');
  const [rateFrequency, setRateFrequency] = useState<RateFrequency>('Weekly');
  const [error, setError] = useState('');

  const createUser = useCreateUser();

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleInvite() {
    if (!email.trim() || roles.length === 0) {
      setError('Email and role are required.');
      return;
    }
    if (rateAmount && Number.isNaN(Number(rateAmount))) {
      setError('Rate amount must be a valid number.');
      return;
    }
    setError('');
    try {
      await createUser.mutateAsync({
        email:          email.trim(),
        role:           roles[0],
        status:         'invited',
        rate_amount:    rateAmount ? parseFloat(rateAmount) : null,
        rate_frequency: rateAmount ? rateFrequency : null,
      });
      navigate('/users', { state: { toastMessage: 'User invited successfully' } });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-2xl">

        <h1 className="text-2xl font-semibold text-[#181D27] mb-8">Invite a new user</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-6">

          {/* Email */}
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />

          {/* System Role */}
          <MultiSelect
            label="Role"
            placeholder="Select role"
            options={ROLE_OPTIONS}
            value={roles}
            onChange={(vals) => setRoles(vals as SystemRole[])}
            columns={1}
          />

          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
            <Input
              label="Rate"
              type="number"
              value={rateAmount}
              onChange={(e) => setRateAmount(e.target.value)}
              placeholder="500"
              leftIcon={<span className="text-sm font-medium text-gray-400">$</span>}
              min="0"
              step="0.01"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#414651]">Frequency</label>
              <div className="relative">
                <select
                  value={rateFrequency}
                  onChange={(e) => setRateFrequency(e.target.value as RateFrequency)}
                  className="border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] bg-white focus:outline-none focus:ring-2 focus:ring-[#9E77ED] focus:border-transparent w-full appearance-none pr-8"
                >
                  {RATE_FREQUENCIES.map((frequency) => (
                    <option key={frequency} value={frequency}>{frequency}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-8">
          <button
            type="button"
            onClick={handleInvite}
            disabled={createUser.isPending}
            className="inline-flex items-center gap-2 bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <UserPlus01 width={18} height={18} />
            {createUser.isPending ? 'Sending invite…' : 'Send Invite'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-[#D5D7DA] text-[#414651] text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Cancel
          </button>
        </div>

      </div>
    </main>
  );
}
