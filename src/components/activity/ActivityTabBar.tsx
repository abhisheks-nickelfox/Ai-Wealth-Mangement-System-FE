export type ActivityTabId = 'recent' | 'files' | 'notes';

const TABS: { id: ActivityTabId; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'files',  label: 'Files & Links' },
  { id: 'notes',  label: 'Notes' },
];

interface ActivityTabBarProps {
  activeId: ActivityTabId;
  onChange: (id: ActivityTabId) => void;
}

export default function ActivityTabBar({ activeId, onChange }: ActivityTabBarProps) {
  return (
    <div className="flex items-center rounded-lg border border-[#D5D7DA] overflow-hidden">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 py-2 text-[12px] font-semibold transition-all border-r last:border-r-0 border-[#D5D7DA] ${
            activeId === tab.id
              ? 'bg-white text-[#181D27]'
              : 'bg-white text-[#717680] hover:text-[#414651] hover:bg-[#F9FAFB]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
