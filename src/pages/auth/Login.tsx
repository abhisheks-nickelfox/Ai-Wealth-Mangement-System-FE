import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from '@untitled-ui/icons-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import Checkbox from '../../components/ui/Checkbox';
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
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />

        {/* Password */}
        <div>
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            error={error || undefined}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
                className={`transition-colors ${error ? 'text-error-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {showPw ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
              </button>
            }
          />

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-error-600 mt-1.5">
              <AlertCircle width={13} height={13} />
              {error}
            </p>
          )}
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between -mt-2">
          <Checkbox
            checked={remember}
            onChange={setRemember}
            label="Remember for 30 days"
          />
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
