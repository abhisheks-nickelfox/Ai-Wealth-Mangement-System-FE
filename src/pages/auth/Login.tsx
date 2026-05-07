import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Eye, EyeOff } from '@untitled-ui/icons-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import Checkbox from '../../components/ui/Checkbox';
import { useAuth } from '../../context/AuthContext';
import { loginSchema } from '../../lib/validation/auth.schemas';

export default function Login() {
  const [showPw,   setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(loginSchema) });

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      await login(data.email, data.password, remember);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('password', { message: (err as Error).message ?? 'Invalid email or password' });
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-[26px] font-semibold text-gray-900 mb-1">Welcome back</h1>
      <p className="text-sm text-gray-500 mb-7">Welcome back! Please enter your details.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* Email */}
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password */}
        <div>
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.password?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
                className={`transition-colors ${errors.password ? 'text-error-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {showPw ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
              </button>
            }
            {...register('password')}
          />
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between -mt-2">
          <Checkbox checked={remember} onChange={setRemember} label="Remember for 30 days" />
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
          disabled={isSubmitting}
          className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
