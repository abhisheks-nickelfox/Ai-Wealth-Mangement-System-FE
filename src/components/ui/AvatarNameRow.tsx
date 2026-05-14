import Avatar from './Avatar';

interface AvatarNameRowProps {
  name: string;
  avatarUrl?: string | null;
  subtitle?: string;
  action?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export default function AvatarNameRow({
  name,
  avatarUrl,
  subtitle,
  action,
  size = 'sm',
  className = '',
}: AvatarNameRowProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Avatar name={name} src={avatarUrl ?? undefined} size={size} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#181D27] truncate">{name}</p>
        {subtitle && (
          <p className="text-xs text-[#717680] truncate">{subtitle}</p>
        )}
      </div>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}
