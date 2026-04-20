import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from '@untitled-ui/icons-react';
import AuthLayout from '../../components/layout/AuthLayout';
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition pr-10"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showConf ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full border rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 transition pr-10 ${
                  error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-brand-600 focus:border-brand-600'
                }`}
              />
              <button type="button" onClick={() => setShowConf(v => !v)} tabIndex={-1}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${error ? 'text-red-400' : 'text-gray-400 hover:text-gray-600'}`}>
                {error ? <AlertCircle width={18} height={18} /> : showConf ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

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
