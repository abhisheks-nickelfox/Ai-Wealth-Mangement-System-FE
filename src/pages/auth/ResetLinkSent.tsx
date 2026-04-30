import { Link } from 'react-router-dom';
import { ArrowLeft, Mail01 } from '@untitled-ui/icons-react';
import AuthLayout from '../../components/layout/AuthLayout';

export default function ResetLinkSent() {
  return (
    <AuthLayout hidePanel>
      {/* Icon */}
      <div className="flex justify-center mb-5">
        <div className="w-14 h-14 rounded-xl border border-[#E9EAEB] shadow-sm flex items-center justify-center bg-white">
          <Mail01 width={28} height={28} className="text-[#344054]" />
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
        Password reset link sent
      </h1>
      <p className="text-sm text-gray-500 mb-7 text-center leading-relaxed">
        We've sent a password reset link to your email. Please check your inbox and
        follow the instructions to reset your password.
      </p>

      {/* Back to login */}
      <Link
        to="/login"
        className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft width={16} height={16} />
        Back to log in
      </Link>
    </AuthLayout>
  );
}
