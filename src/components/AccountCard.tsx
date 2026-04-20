import { ChevronDown } from '@untitled-ui/icons-react';
import { ChevronSelectorVertical } from '@untitled-ui/icons-react';

interface AccountCardUser {
  name: string;
  email: string;
  avatar?: string;
}

interface AccountCardProps {
  user: AccountCardUser;
  /** Show a ChevronDown icon (used in Header / page-level card) */
  showChevron?: boolean;
  /** Show a ChevronSelectorVertical icon (used in TopBar button) */
  showSelectorChevron?: boolean;
  /** Render the online status dot */
  showOnlineDot?: boolean;
  /** Wrap in a <button> instead of a <div> */
  asButton?: boolean;
  className?: string;
}

export default function AccountCard({
  user,
  showChevron = false,
  showSelectorChevron = false,
  showOnlineDot = false,
  asButton = false,
  className = '',
}: AccountCardProps) {
  const avatarNode = (
    <div className="relative shrink-0">
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover border border-[rgba(0,0,0,0.08)]"
          style={{ backgroundColor: '#E9DCBB' }}
        />
      ) : (
        <div className="w-10 h-10 rounded-full border border-gray-200 bg-warning-200" />
      )}
      {showOnlineDot && (
        <span className="absolute bottom-[-1px] right-[-1px] w-[10px] h-[10px] bg-[#17B26A] rounded-[5px] border-[1.5px] border-white" />
      )}
    </div>
  );

  const innerContent = (
    <>
      {avatarNode}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-[#181D27] leading-5 truncate">{user.name}</p>
        <p className="text-sm text-[#535862] leading-5 truncate">{user.email}</p>
      </div>
      {showChevron && (
        <ChevronDown width={16} height={16} className="text-gray-400 absolute top-2 right-2" />
      )}
      {showSelectorChevron && (
        <ChevronSelectorVertical width={16} height={16} className="text-[#717680] shrink-0" />
      )}
    </>
  );

  const baseClasses = `flex items-center gap-3 border border-[#E9EAEB] rounded-xl px-3 py-2 relative min-w-[220px] ${className}`;

  if (asButton) {
    return (
      <button className={`${baseClasses} bg-white hover:bg-gray-50 transition-colors cursor-pointer`}>
        {innerContent}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} bg-white cursor-pointer`}>
      {innerContent}
    </div>
  );
}
