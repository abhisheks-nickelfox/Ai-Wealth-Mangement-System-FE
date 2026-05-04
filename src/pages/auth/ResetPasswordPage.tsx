import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Eye, EyeOff, AlertCircle } from '@untitled-ui/icons-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import { authApi } from '../../lib/api';
import { resetPasswordSchema } from '../../lib/validation/auth.schemas';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get('token') ?? '';

  const [showPw,   setShowPw]   = useState(false);
  const [showConf, setShowConf] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(resetPasswordSchema) });

  const onSubmit = async (data: { password: string; confirm: string }) => {
    if (!token) {
      setError('confirm', { message: 'Invalid or missing reset token. Please request a new link.' });
      return;
    }
    try {
      await authApi.resetPassword(token, data.password);
      navigate('/login', { replace: true });
    } catch (err) {
      setError('confirm', { message: (err as Error).message ?? 'Something went wrong. Please try again.' });
    }
  };

  return (
    <AuthLayout hidePanel>
      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-[32px] font-semibold text-gray-900 mb-2 text-center">Set new password</h1>
        <p className="text-sm text-gray-500 mb-7 text-center">Must be at least 8 characters.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

          <Input
            label="Enter Password"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.password?.message}
            rightIcon={
              <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1}
                className="text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
              </button>
            }
            {...register('password')}
          />

          <div>
            <Input
              label="Confirm Password"
              type={showConf ? 'text' : 'password'}
              placeholder="••••••••"
              error={errors.confirm?.message}
              rightIcon={
                <button type="button" onClick={() => setShowConf((v) => !v)} tabIndex={-1}
                  className={errors.confirm ? 'text-error-400' : 'text-gray-400 hover:text-gray-600'}>
                  {errors.confirm
                    ? <AlertCircle width={18} height={18} />
                    : showConf ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                </button>
              }
              {...register('confirm')}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors"
          >
            {isSubmitting ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
