import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Key01 } from '@untitled-ui/icons-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import { authApi } from '../../lib/api';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      navigate('/reset-link-sent');
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout hidePanel>
      <div className="max-w-sm mx-auto w-full">
      {/* Key icon */}
      <div className="flex justify-center mb-6">
        <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-center">
          <Key01 width={22} height={22} className="text-gray-600" />
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-[27px] font-semibold text-gray-900 mb-2 text-center">Forgot password?</h1>
      <p className="text-sm text-gray-500 mb-7 text-center">
        No worries, we'll send you reset instructions.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          error={error || undefined}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors"
        >
          {loading ? 'Sending…' : 'Reset password'}
        </button>
      </form>

      {/* Back to login */}
      <Link
        to="/login"
        className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors mt-6"
      >
        <ArrowLeft width={16} height={16} />
        Back to log in
      </Link>
      </div>
    </AuthLayout>
  );
}
