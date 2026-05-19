import { useMemo } from 'react'
import TimeEntryUserGroup from './TimeEntryUserGroup'
import type { TaskTimeEntrySummary } from '../../lib/api'
import type { EditTimeEntryPayload } from './EditTimeEntryPopup'

interface TimeEntriesListProps {
  summary:       TaskTimeEntrySummary
  currentUserId: string
  onDelete:      (entryId: string) => void
  onEdit?:       (entryId: string, payload: EditTimeEntryPayload) => Promise<void>
}

export default function TimeEntriesList({ summary, currentUserId, onDelete, onEdit }: TimeEntriesListProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, {
      userId:    string
      userName:  string
      avatarUrl: string | null
      entries:   typeof summary.own_entries
      total:     number
    }>()

    for (const entry of summary.own_entries) {
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

    return Array.from(map.values()).sort((a, b) => {
      if (a.userId === currentUserId) return -1
      if (b.userId === currentUserId) return 1
      return a.userName.localeCompare(b.userName)
    })
  }, [summary.own_entries, currentUserId])

  if (grouped.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-[12px] text-[#A4A7AE]">
        No time entries yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col">
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
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
