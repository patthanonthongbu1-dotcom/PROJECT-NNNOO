/** Skeleton matching the header-plus-content shape of most pages. */
export default function Loading() {
  return (
    <div className="animate-pulse p-6 sm:p-8" aria-hidden>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="size-40 shrink-0 rounded bg-surface-2" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-20 rounded bg-surface-2" />
          <div className="h-12 w-2/3 rounded bg-surface-2" />
          <div className="h-4 w-1/3 rounded bg-surface-2" />
        </div>
      </div>
      <div className="mt-12 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-5 rounded bg-surface-2" style={{ width: `${55 + ((i * 13) % 40)}%` }} />
        ))}
      </div>
    </div>
  )
}
