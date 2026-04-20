import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from '@untitled-ui/icons-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, remember);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError((err as Error).message ?? 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Heading */}
      <h1 className="text-[26px] font-semibold text-gray-900 mb-1">Welcome back</h1>
      <p className="text-sm text-gray-500 mb-7">Welcome back! Please enter your details.</p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={`w-full border rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 transition pr-10 ${
                error
                  ? 'border-error-500 focus:ring-error-300 focus:border-error-500'
                  : 'border-gray-300 focus:ring-brand-600 focus:border-brand-600'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              tabIndex={-1}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                error ? 'text-error-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {showPw ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
            </button>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-error-600 mt-1.5">
              <AlertCircle width={13} height={13} />
              {error}
            </p>
          )}
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between -mt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 accent-brand-600 cursor-pointer"
            />
            <span className="text-sm text-gray-600">Remember for 30 days</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
          >
            Forgot password
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
