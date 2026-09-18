import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-base p-8 text-center">
      <div>
        <p className="text-sm font-bold text-ink-muted">404</p>
        <h1 className="mt-2 text-4xl font-black text-ink">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-4 text-ink-muted">
          The link may be wrong, or the song may not be published yet.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-accent px-8 py-3 font-bold text-black transition-colors hover:bg-accent-hover"
        >
          Back home
        </Link>
      </div>
    </div>
  )
}
