import { Plus } from '@untitled-ui/icons-react';
import Avatar from './Avatar';

interface AvatarItem {
  src?: string;
  name: string;
}

interface AvatarStackProps {
  avatars: AvatarItem[];
  max?: number;
  showAddButton?: boolean;
  onAdd?: () => void;
  /** Render the "+" as a plain div instead of a button — use when AvatarStack sits inside a <button> to avoid nesting */
  addAs?: 'button' | 'div';
}

const ADD_BTN_CLS =
  'w-6 h-6 rounded-full border border-dashed border-gray-300 bg-white flex items-center justify-center ml-1 shrink-0 text-gray-400 hover:border-[#7F56D9] hover:text-[#7F56D9] transition-colors';

export default function AvatarStack({
  avatars,
  max = 3,
  showAddButton = true,
  onAdd,
  addAs = 'button',
}: AvatarStackProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div className="flex items-center">
      <div className="flex">
        {visible.map((avatar, i) => (
          <div
            key={i}
            style={{ marginLeft: i === 0 ? 0 : '-6px', zIndex: visible.length - i, position: 'relative' }}
            className="rounded-full border-2 border-white shrink-0"
          >
            <Avatar name={avatar.name} src={avatar.src} size="xs" />
          </div>
        ))}
        {overflow > 0 && (
          <div
            className="w-6 h-6 rounded-full border-2 border-white bg-[#F2F4F7] flex items-center justify-center shrink-0"
            style={{ marginLeft: '-6px', zIndex: 0, position: 'relative' }}
          >
            <span className="text-[9px] font-semibold text-[#717680]">+{overflow}</span>
          </div>
        )}
      </div>

      {showAddButton && (
        addAs === 'div' ? (
          <div className={`${ADD_BTN_CLS} pointer-events-none`}>
            <Plus width={10} height={10} />
          </div>
        ) : (
          <button type="button" onClick={onAdd} className={ADD_BTN_CLS} aria-label="Add assignee">
            <Plus width={10} height={10} />
          </button>
        )
      )}
    </div>
  );
}
