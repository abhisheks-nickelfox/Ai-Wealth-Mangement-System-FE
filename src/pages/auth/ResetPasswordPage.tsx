import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { Eye, EyeOff, AlertCircle } from '@untitled-ui/icons-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authApi } from '../../lib/api';
import { resetPasswordSchema } from '../../validations/auth.validations';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get('token') ?? '';

  const [showPw,   setShowPw]   = useState(false);
  const [showConf, setShowConf] = useState(false);

  return (
    <AuthLayout hidePanel>
      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-[32px] font-semibold text-gray-900 mb-2 text-center">Set new password</h1>
        <p className="text-sm text-gray-500 mb-7 text-center">Must be at least 8 characters.</p>

        <Formik
          initialValues={{ password: '', confirm: '' }}
          validationSchema={resetPasswordSchema}
          onSubmit={async (values, { setFieldError, setSubmitting }) => {
            if (!token) {
              setFieldError('confirm', 'Invalid or missing reset token. Please request a new link.');
              setSubmitting(false);
              return;
            }
            try {
              await authApi.resetPassword(token, values.password);
              navigate('/login', { replace: true });
            } catch (err) {
              setFieldError('confirm', (err as Error).message ?? 'Something went wrong. Please try again.');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
            <Form className="flex flex-col gap-5">

              <Input
                label="Enter Password"
                type={showPw ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && errors.password ? errors.password : undefined}
                rightIcon={
                  <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1}
                    className="text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                  </button>
                }
              />

              <div>
                <Input
                  label="Confirm Password"
                  type={showConf ? 'text' : 'password'}
                  name="confirm"
                  placeholder="••••••••"
                  value={values.confirm}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.confirm && errors.confirm ? errors.confirm : undefined}
                  rightIcon={
                    <button type="button" onClick={() => setShowConf((v) => !v)} tabIndex={-1}
                      className={touched.confirm && errors.confirm ? 'text-error-400' : 'text-gray-400 hover:text-gray-600'}>
                      {touched.confirm && errors.confirm
                        ? <AlertCircle width={18} height={18} />
                        : showConf ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                    </button>
                  }
                />
              </div>

              <Button type="submit" variant="primary" className="w-full justify-center" loading={isSubmitting}>
                Reset Password
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </AuthLayout>
  );
}
