import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { Eye, EyeOff } from '@untitled-ui/icons-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import Checkbox from '../../components/ui/Checkbox';
import { useAuth } from '../../context/AuthContext';
import { loginSchema } from '../../validations/auth.validations';

export default function Login() {
  const [showPw,   setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  return (
    <AuthLayout>
      <h1 className="text-[26px] font-semibold text-gray-900 mb-1">Welcome back</h1>
      <p className="text-sm text-gray-500 mb-7">Welcome back! Please enter your details.</p>

      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={loginSchema}
        onSubmit={async (values, { setFieldError, setSubmitting }) => {
          try {
            await login(values.email, values.password, remember);
            navigate('/dashboard', { replace: true });
          } catch (err) {
            setFieldError('password', (err as Error).message ?? 'Invalid email or password');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
          <Form className="flex flex-col gap-5">

            {/* Email */}
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && errors.email ? errors.email : undefined}
            />

            {/* Password */}
            <div>
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && errors.password ? errors.password : undefined}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                    className={`transition-colors ${touched.password && errors.password ? 'text-error-500' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {showPw ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                  </button>
                }
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
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
}
