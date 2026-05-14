import { useState } from 'react'
import { ChevronDown, ChevronRight } from '@untitled-ui/icons-react'
import Avatar from '../ui/Avatar'
import TimeEntryRow from './TimeEntryRow'
import { formatSeconds } from '../../lib/timeUtils'
import type { TimeEntry } from '../../lib/api'

interface TimeEntryUserGroupProps {
  userId:        string
  userName:      string
  avatarUrl:     string | null
  entries:       TimeEntry[]
  totalSeconds:  number
  defaultOpen?:  boolean
  currentUserId: string
  onDelete:      (entryId: string) => void
}

export default function TimeEntryUserGroup({
  userId, userName, avatarUrl, entries, totalSeconds,
  defaultOpen = false, currentUserId, onDelete,
}: TimeEntryUserGroupProps) {
  const [open, setOpen] = useState(defaultOpen)
  const canEdit = userId === currentUserId

  return (
    <div className="border-t border-[#F2F4F7] first:border-t-0">
      {/* User header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#F9FAFB] transition-colors"
      >
        {open
          ? <ChevronDown  width={14} height={14} className="text-[#717680] shrink-0" />
          : <ChevronRight width={14} height={14} className="text-[#717680] shrink-0" />
        }
        <Avatar name={userName} src={avatarUrl ?? undefined} size="sm" />
        <span className="flex-1 text-left text-[13px] font-semibold text-[#344054]">
          {userName}
        </span>
        <span className="text-[13px] font-semibold text-[#344054] shrink-0">
          {formatSeconds(totalSeconds)}
        </span>
      </button>

      {/* Expanded entries */}
      {open && entries.map((entry) => (
        <TimeEntryRow
          key={entry.id}
          entry={entry}
          canEdit={canEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
