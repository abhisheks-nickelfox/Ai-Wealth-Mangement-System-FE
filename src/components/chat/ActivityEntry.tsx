import Avatar from '../ui/Avatar';
import type { Message } from '../../lib/api';
import { timeAgo } from '../../lib/dateUtils';

export function ActivityEntry({ message }: { message: Message }) {
  const actor = message.author;

  return (
    <div className="flex items-center gap-2.5 py-1 px-1 group">
      <Avatar
        name={actor.name}
        src={actor.avatar_url ?? undefined}
        size="xs"
        className="shrink-0 w-5 h-5 text-[8px]"
      />
      <p className="text-[12.5px] text-[#6C737A] leading-snug">
        <span className="font-medium text-[#344054]">
          {actor.name?.split(' ')[0] ?? 'Someone'}
        </span>
        {' '}
        <span>{message.body}</span>
        {' '}
        <span className="text-[11px] text-[#98A2B3]">{timeAgo(message.created_at)}</span>
      </p>
    </div>
  );
}
