import { Trash01, Clock } from '@untitled-ui/icons-react'
import { formatEntryDateRange, formatSeconds } from '../../lib/timeUtils'
import type { TimeEntry } from '../../lib/api'

interface TimeEntryRowProps {
  entry:   TimeEntry
  onDelete: (entryId: string) => void
  canEdit:  boolean
}

export default function TimeEntryRow({ entry, onDelete, canEdit }: TimeEntryRowProps) {
  const dateRange = formatEntryDateRange(entry.started_at, entry.ended_at)
  const duration  = formatSeconds(entry.duration_seconds ?? 0)

  return (
    <div className="flex items-center gap-2 pl-9 pr-3 py-2.5 bg-[#F9FAFB] border-t border-[#F2F4F7] group">
      {/* Date range */}
      <span className="flex-1 text-[12px] text-[#535862] truncate">{dateRange}</span>

      {/* Clock icon */}
      <Clock width={13} height={13} className="text-[#A4A7AE] shrink-0" />

      {/* Duration */}
      <span className="text-[12px] font-semibold text-[#344054] shrink-0 w-[46px] text-right">
        {duration}
      </span>

      {/* Delete — only for own entries, shown on hover */}
      {canEdit ? (
        <button
          onClick={() => onDelete(entry.id)}
          className="shrink-0 text-[#A4A7AE] hover:text-[#F04438] transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Delete entry"
        >
          <Trash01 width={14} height={14} />
        </button>
      ) : (
        <span className="w-[14px] shrink-0" />
      )}
    </div>
  )
}
