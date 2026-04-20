// Desktop-5: Email template preview (as shown in the Figma design)
export default function EmailPreview() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      {/* Email card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-10 font-sans text-sm text-gray-700 leading-relaxed">

        <p className="mb-4">Hi,</p>

        <p className="mb-4">
          We received a request to reset your password.
        </p>

        <p className="mb-1">
          Click the button below to create a new password:
        </p>
        <p className="mb-4 text-gray-500 text-xs">[Reset Password]</p>

        <p className="mb-4">
          This link will expire in 24 hours for security reasons.
        </p>

        <p className="mb-6">
          If you didn't request a password reset, you can safely ignore this email.
        </p>

        <p className="mb-6">
          Thanks,<br />
          AI Wealth Team
        </p>

        {/* CTA button */}
        <button className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
          Reset password
        </button>
      </div>
    </div>
  );
}
