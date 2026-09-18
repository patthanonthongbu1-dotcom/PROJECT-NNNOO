'use client'

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center p-8 text-center">
      <div>
        <h1 className="text-3xl font-black text-ink">Something broke</h1>
        <p className="mt-4 max-w-md text-ink-muted">
          {/* The digest is the only safe handle on the server-side error;
              the message itself is redacted in production builds. */}
          This page failed to load.
          {error.digest && (
            <>
              {' '}
              <span className="font-mono text-xs text-ink-faint">
                ({error.digest})
              </span>
            </>
          )}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-full bg-accent px-8 py-3 font-bold text-black transition-colors hover:bg-accent-hover"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
