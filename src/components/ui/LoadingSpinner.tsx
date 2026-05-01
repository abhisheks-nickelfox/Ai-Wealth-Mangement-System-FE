interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ message, fullPage = false }: LoadingSpinnerProps) {
  const inner = (
    <>
      <div
        className="w-6 h-6 border-2 border-[#7F56D9] border-t-transparent rounded-full animate-spin"
        aria-label="Loading"
      />
      {message && <p className="text-[13px] text-[#717680] mt-3">{message}</p>}
    </>
  );

  if (fullPage) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        {inner}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {inner}
    </div>
  );
}
