import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from '@untitled-ui/icons-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import { authApi } from '../../lib/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get('token') ?? '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Password does not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      navigate('/login', { replace: true });
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout hidePanel>
      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-[32px] font-semibold text-gray-900 mb-2 text-center">Set new password</h1>
        <p className="text-sm text-gray-500 mb-7 text-center">
          Must be at least 8 characters.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Enter Password */}
          <Input
            label="Enter Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            rightIcon={
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                className="text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
              </button>
            }
          />

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            type={showConf ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            error={error || undefined}
            rightIcon={
              <button type="button" onClick={() => setShowConf(v => !v)} tabIndex={-1}
                className={error ? 'text-error-400' : 'text-gray-400 hover:text-gray-600'}>
                {error ? <AlertCircle width={18} height={18} /> : showConf ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
              </button>
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors"
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
