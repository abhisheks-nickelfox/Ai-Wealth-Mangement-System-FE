import { useRef, useState } from 'react'
import { Trash01, Clock, Edit01 } from '@untitled-ui/icons-react'
import { formatEntryDateRange, formatSeconds } from '../../lib/timeUtils'
import type { TimeEntry } from '../../lib/api'
import EditTimeEntryPopup from './EditTimeEntryPopup'
import type { EditTimeEntryPayload } from './EditTimeEntryPopup'

interface TimeEntryRowProps {
  entry:    TimeEntry
  canEdit:  boolean
  onDelete: (entryId: string) => void
  onEdit?:  (entryId: string, payload: EditTimeEntryPayload) => Promise<void>
}

export default function TimeEntryRow({ entry, canEdit, onDelete, onEdit }: TimeEntryRowProps) {
  const [showEdit, setShowEdit] = useState(false)
  const rowRef                  = useRef<HTMLDivElement>(null)

  const dateRange = formatEntryDateRange(entry.started_at, entry.ended_at)
  const duration  = formatSeconds(entry.duration_seconds ?? 0)
  const note      = entry.description?.trim()

  return (
    <div ref={rowRef} className="relative pl-9 pr-3 py-2.5 bg-[#F9FAFB] border-t border-[#F2F4F7] group">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-[12px] text-[#535862] truncate">{dateRange}</span>
        <Clock width={13} height={13} className="text-[#A4A7AE] shrink-0" />
        <span className="text-[12px] font-semibold text-[#344054] shrink-0 w-[46px] text-right">
          {duration}
        </span>

        {canEdit ? (
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <button
                onClick={() => setShowEdit(true)}
                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                  showEdit
                    ? 'bg-[#F4F3FF] text-[#7F56D9]'
                    : 'text-[#C8CBD0] hover:text-[#7F56D9] hover:bg-[#F4F3FF]'
                }`}
                aria-label="Edit entry"
              >
                <Edit01 width={13} height={13} />
              </button>
            )}
            <button
              onClick={() => onDelete(entry.id)}
              className="w-6 h-6 flex items-center justify-center rounded text-[#C8CBD0] hover:text-[#F04438] hover:bg-[#FEF3F2] transition-colors"
              aria-label="Delete entry"
            >
              <Trash01 width={13} height={13} />
            </button>
          </div>
        ) : (
          <span className="w-[30px] shrink-0" />
        )}
      </div>

      {note && (
        <p className="mt-1 text-[11px] text-[#717680] leading-relaxed break-words pr-6">
          {note}
        </p>
      )}

      {showEdit && onEdit && (
        <EditTimeEntryPopup
          entry={entry}
          anchorRef={rowRef}
          onSave={(entryId, payload) => onEdit(entryId, payload)}
          onDelete={(entryId) => {
            onDelete(entryId)
            setShowEdit(false)
          }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
