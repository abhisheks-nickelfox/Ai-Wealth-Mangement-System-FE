import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { ArrowLeft, Key01 } from '@untitled-ui/icons-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import { authApi } from '../../lib/api';
import { forgotPasswordSchema } from '../../validations/auth.validations';

export default function ForgotPassword() {
  const navigate = useNavigate();

  return (
    <AuthLayout hidePanel>
      <div className="flex justify-center mb-6">
        <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-center">
          <Key01 width={22} height={22} className="text-gray-600" />
        </div>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">Forgot password?</h1>
      <p className="text-sm text-gray-500 mb-7 text-center">
        No worries, we'll send you reset instructions.
      </p>

      <Formik
        initialValues={{ email: '' }}
        validationSchema={forgotPasswordSchema}
        onSubmit={async (values, { setFieldError, setSubmitting }) => {
          try {
            await authApi.forgotPassword(values.email);
            navigate('/reset-link-sent');
          } catch (err) {
            setFieldError('email', (err as Error).message ?? 'Something went wrong. Please try again.');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
          <Form className="flex flex-col gap-4">
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors"
            >
              {isSubmitting ? 'Sending…' : 'Reset password'}
            </button>
          </Form>
        )}
      </Formik>

      <Link
        to="/login"
        className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors mt-6"
      >
        <ArrowLeft width={16} height={16} />
        Back to log in
      </Link>
    </AuthLayout>
  );
}
