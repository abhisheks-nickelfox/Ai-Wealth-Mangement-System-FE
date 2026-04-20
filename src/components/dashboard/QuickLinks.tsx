import { UserPlus01, ClockCheck, FolderPlus, File02 } from '@untitled-ui/icons-react';

const LINKS = [
  { label: 'Add a Client',       sub: 'Add yourself or import', Icon: UserPlus01 },
  { label: 'View Timesheets',    sub: 'Add yourself or import', Icon: ClockCheck  },
  { label: 'Create a Project',   sub: 'Add yourself or import', Icon: FolderPlus  },
  { label: 'Manage Transcripts', sub: 'Add yourself or import', Icon: File02      },
];

export default function QuickLinks() {
  return (
    <div>
      <h2 className="text-[17px] font-semibold text-gray-900 mb-3">Quick Links</h2>
      <div className="grid grid-cols-4 gap-3">
        {LINKS.map(({ label, sub, Icon }) => (
          <button
            key={label}
            className="flex items-start gap-3 border border-gray-200 rounded-xl p-3.5 bg-white text-left hover:shadow-sm transition-shadow"
          >
            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 text-gray-600 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
              <Icon width={20} height={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 leading-tight mb-0.5">{label}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
