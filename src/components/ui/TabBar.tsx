import Badge from './Badge';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function TabBar({ tabs, activeId, onChange, className = '' }: TabBarProps) {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 pb-2.5 pt-2 mr-5 text-[14px] font-semibold transition-all border-b-2 -mb-px ${
            activeId === tab.id
              ? 'border-[#7F56D9] text-[#7F56D9]'
              : 'border-transparent text-[#717680] hover:text-gray-700'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <Badge variant="brand" size="sm">
              {tab.count}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}
