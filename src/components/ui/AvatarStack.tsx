import { Plus } from '@untitled-ui/icons-react';

interface AvatarItem {
  src?: string;
  name: string;
  bg?: string;
}

interface AvatarStackProps {
  avatars: AvatarItem[];
  max?: number;
  showAddButton?: boolean;
}

// Placeholder colors for avatars without explicit bg
const PLACEHOLDER_COLORS = ['#D6BBFB', '#93C5FD', '#6EE7B7'];

export default function AvatarStack({
  avatars,
  max = 3,
  showAddButton = true,
}: AvatarStackProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div className="flex items-center">
      <div className="flex">
        {visible.map((avatar, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border-2 border-white shrink-0"
            style={{
              backgroundColor: avatar.bg ?? PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length],
              marginLeft: i === 0 ? 0 : '-6px',
              zIndex: visible.length - i,
              position: 'relative',
            }}
          >
            {avatar.src && (
              <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover rounded-full" />
            )}
          </div>
        ))}
        {overflow > 0 && (
          <div
            className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center shrink-0"
            style={{ marginLeft: '-6px', zIndex: 0, position: 'relative' }}
          >
            <span className="text-[10px] font-semibold text-gray-500">+{overflow}</span>
          </div>
        )}
      </div>
      {showAddButton && (
        <button
          className="w-6 h-6 rounded-full border border-dashed border-gray-300 bg-white flex items-center justify-center ml-2 shrink-0 text-gray-400 hover:border-gray-400 transition-colors"
          aria-label="Add assignee"
        >
          <Plus width={10} height={10} />
        </button>
      )}
    </div>
  );
}
