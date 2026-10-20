'use client'

import { useEffect, useState } from 'react'
import { timeUntil } from '@/lib/format'

/**
 * Live days/hours/minutes/seconds until a release date.
 *
 * The clock starts after mount: the server and the browser disagree about
 * "now", so rendering it on the server would cause a hydration mismatch.
 */
export function Countdown({ date }: { date: string }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [])

  if (now === null) return <div className="h-16" aria-hidden />

  const left = timeUntil(date, now)
  if (!left) {
    return <p className="text-lg font-bold text-accent">Out now</p>
  }

  const units = [
    ['days', left.days],
    ['hrs', left.hours],
    ['min', left.minutes],
    ['sec', left.seconds],
  ] as const

  return (
    <div
      role="timer"
      aria-label={`Releases in ${left.days} days, ${left.hours} hours, ${left.minutes} minutes`}
      className="flex gap-2"
    >
      {units.map(([label, value]) => (
        <div
          key={label}
          aria-hidden
          className="flex min-w-16 flex-col items-center rounded bg-base/60 px-3 py-2"
        >
          <span className="text-2xl font-black tabular-nums text-ink">
            {String(value).padStart(2, '0')}
          </span>
          <span className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
