import { ChevronRight } from '@untitled-ui/icons-react';

export default function Header() {
  return (
    <div className="px-8 pt-6 pb-0">
      <nav className="flex items-center gap-1 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-md border border-gray-200 bg-warning-200 shrink-0" />
          <span className="text-[13px] font-semibold text-gray-500 px-2 py-1 rounded-md">
            Sienna Hewitt
          </span>
        </div>
        <ChevronRight width={16} height={16} className="text-gray-400" />
        <span className="text-[13px] font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
          Dashboard
        </span>
      </nav>

      <h1 className="text-[22px] font-semibold text-gray-900 leading-snug mb-1">
        Welcome back, Sienna
      </h1>
      <p className="text-sm text-gray-500">
        Here's an overview of your site traffic and recently active users.
      </p>
    </div>
  );
}
