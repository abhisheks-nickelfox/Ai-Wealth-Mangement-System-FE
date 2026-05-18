export function parseTimeInput(input: string): number | null {
  const s = input.trim().toLowerCase()
  let seconds = 0
  const hMatch = s.match(/(\d+(?:\.\d+)?)\s*h/)
  const mMatch = s.match(/(\d+)\s*m/)
  const sMatch = s.match(/(\d+)\s*s/)
  if (hMatch) seconds += parseFloat(hMatch[1]) * 3600
  if (mMatch) seconds += parseInt(mMatch[1]) * 60
  if (sMatch) seconds += parseInt(sMatch[1])
  if (!hMatch && !mMatch && !sMatch) {
    const plain = parseFloat(s)
    if (!isNaN(plain)) seconds = plain * 3600
  }
  return seconds > 0 ? Math.round(seconds) : null
}

export function formatSeconds(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

// "Thu, May 14" from an ISO string or datetime-local string
export function formatEntryDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// "7:44 pm" from an ISO or datetime-local string
export function formatEntryTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
}

// "Wed, Mar 11, 9:49 am – 11:54 am EDT (UTC-4)" used in entry rows
export function formatEntryDateRange(startedAt: string, endedAt: string | null): string {
  const start    = new Date(startedAt)
  const dateStr  = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const startT   = formatEntryTime(startedAt)
  if (!endedAt) return `${dateStr}, ${startT} – …`
  const endT = formatEntryTime(endedAt)
  const tz   = start.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop() ?? ''
  const off  = -start.getTimezoneOffset() / 60
  const sign = off >= 0 ? '+' : '-'
  const tzOff = `UTC${sign}${Math.abs(off)}`
  return `${dateStr}, ${startT} – ${endT} ${tz} (${tzOff})`
}

export function formatDeadline(deadline: string | null): { text: string; overdue: boolean } {
  if (!deadline) return { text: '—', overdue: false };
  const d = new Date(deadline + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0)  return { text: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { text: 'Today',    overdue: true };
  if (diff === 1) return { text: 'Tomorrow', overdue: false };
  return {
    text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    overdue: false,
  };
}

export function nowISO(): string { return new Date().toISOString() }

export function todayDatetimeLocal(): string {
  const now = new Date()
  now.setSeconds(0, 0)
  return now.toISOString().slice(0, 16)
}
