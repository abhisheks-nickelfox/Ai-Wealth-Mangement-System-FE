import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight } from '@untitled-ui/icons-react'
import TaskIcon from '../icons/TaskIcon'
import TimeEntryUserGroup from './TimeEntryUserGroup'
import { formatSeconds } from '../../lib/timeUtils'
import type { TimeEntry, SubtaskTimeSummary } from '../../lib/api'

interface TimesheetTaskRowProps {
  title:         string
  totalSeconds:  number
  entries:       TimeEntry[]
  subtasks?:     SubtaskTimeSummary[]
  currentUserId: string
  onDelete:      (entryId: string) => void
  defaultOpen?:  boolean
  depth?:        number   // 0 = task, 1 = subtask (controls indent + bg shade)
}

export default function TimesheetTaskRow({
  title, totalSeconds, entries, subtasks = [],
  currentUserId, onDelete, defaultOpen = false, depth = 0,
}: TimesheetTaskRowProps) {
  const [open, setOpen] = useState(defaultOpen)

  const grouped = useMemo(() => {
    const map = new Map<string, {
      userId:    string
      userName:  string
      avatarUrl: string | null
      entries:   TimeEntry[]
      total:     number
    }>()
    for (const entry of entries) {
      const uid = entry.user_id
      if (!map.has(uid)) {
        map.set(uid, {
          userId:    uid,
          userName:  entry.user?.name ?? 'Unknown',
          avatarUrl: entry.user?.avatar_url ?? null,
          entries:   [],
          total:     0,
        })
      }
      const g = map.get(uid)!
      g.entries.push(entry)
      g.total += entry.duration_seconds ?? 0
    }
    return Array.from(map.values()).sort((a, b) =>
      a.userId === currentUserId ? -1 : b.userId === currentUserId ? 1 : a.userName.localeCompare(b.userName)
    )
  }, [entries, currentUserId])

  const hasContent = grouped.length > 0 || subtasks.length > 0
  const indentPx   = depth * 16
  const headerBg   = depth === 0 ? '' : 'bg-[#FAFAFA]'
  const bodyBg     = depth === 0 ? 'bg-[#FAFAFA]' : 'bg-[#F5F5F5]'

  return (
    <div className={`border-t border-[#F2F4F7] first:border-t-0 ${headerBg}`}>
      {/* Row header */}
      <button
        type="button"
        onClick={() => hasContent && setOpen((v) => !v)}
        className={`w-full flex items-center gap-2.5 py-2.5 pr-3 transition-colors ${
          hasContent ? 'hover:bg-[#F0F0F0] cursor-pointer' : 'cursor-default'
        }`}
        style={{ paddingLeft: `${12 + indentPx}px` }}
      >
        {hasContent
          ? (open
              ? <ChevronDown  width={14} height={14} className="text-[#717680] shrink-0" />
              : <ChevronRight width={14} height={14} className="text-[#717680] shrink-0" />)
          : <span className="w-[14px] shrink-0" />
        }
        <TaskIcon width={13} height={13} className="text-[#A4A7AE] shrink-0" />
        <span className="flex-1 text-left text-[13px] font-semibold text-[#344054] truncate">{title}</span>
        <span className="text-[13px] font-semibold text-[#344054] shrink-0">
          {totalSeconds > 0 ? formatSeconds(totalSeconds) : '—'}
        </span>
      </button>

      {/* Expanded body */}
      {open && (
        <div className={bodyBg}>
          {/* Direct entries grouped by user */}
          {grouped.map((g) => (
            <TimeEntryUserGroup
              key={g.userId}
              userId={g.userId}
              userName={g.userName}
              avatarUrl={g.avatarUrl}
              entries={g.entries}
              totalSeconds={g.total}
              defaultOpen={g.userId === currentUserId}
              currentUserId={currentUserId}
              onDelete={onDelete}
            />
          ))}

          {/* Nested subtask rows */}
          {subtasks.map((sub) => (
            <TimesheetTaskRow
              key={sub.task_id}
              title={sub.title}
              totalSeconds={sub.total_seconds}
              entries={sub.entries}
              currentUserId={currentUserId}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}

          {grouped.length === 0 && subtasks.length === 0 && (
            <p className="py-2 text-[12px] text-[#A4A7AE]" style={{ paddingLeft: `${32 + indentPx}px` }}>
              No time logged yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
