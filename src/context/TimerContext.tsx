import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'

interface TimerState {
  entryId:   string
  taskId:    string
  projectId?: string
  taskTitle: string
  startedAt: string
}

interface TimerContextValue {
  running:    TimerState | null
  elapsed:    number
  startTimer: (state: TimerState) => void
  stopTimer:  () => void
}

const TimerContext = createContext<TimerContextValue>({
  running: null, elapsed: 0,
  startTimer: () => {}, stopTimer: () => {},
})

const STORAGE_KEY = 'mw_running_timer'

export function TimerProvider({ children }: { children: ReactNode }) {
  const [running, setRunning] = useState<TimerState | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') } catch { return null }
  })
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running) { setElapsed(0); return }
    function tick() {
      setElapsed(Math.floor((Date.now() - new Date(running!.startedAt).getTime()) / 1000))
    }
    tick()
    intervalRef.current = setInterval(tick, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const startTimer = useCallback((state: TimerState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    setRunning(state)
  }, [])

  const stopTimer = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setRunning(null)
    setElapsed(0)
  }, [])

  return (
    <TimerContext.Provider value={{ running, elapsed, startTimer, stopTimer }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() { return useContext(TimerContext) }
