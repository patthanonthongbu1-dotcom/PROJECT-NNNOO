'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Countdown } from '@/components/Countdown'
import { LockIcon } from '@/components/MerchCard'
import { MERCH_TYPE_LABEL, type MerchItem } from '@/lib/merch'
import { formatDate } from '@/lib/format'

const SLIDE_MS = 1600

/**
 * The "Now Playing" card: a photo slideshow dressed up as a music player.
 * Prev/next/shuffle are page navigations, so leaving the page stops it.
 */
export function MerchPlayer({
  item,
  position,
  total,
  prevSlug,
  nextSlug,
  otherSlugs,
}: {
  item: MerchItem
  position: number
  total: number
  prevSlug: string
  nextSlug: string
  otherSlugs: string[]
}) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [wanted, setWanted] = useState(false)

  const photos = item.photos
  const locked = item.status === 'locked' || photos.length === 0
  const photo = photos[index]

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setIndex((i) => (i + 1) % photos.length), SLIDE_MS)
    return () => clearInterval(id)
  }, [playing, photos.length])

  const shuffle = () => {
    const slug = otherSlugs[Math.floor(Math.random() * otherSlugs.length)]
    if (slug) router.push(`/merch/${slug}`)
  }

  const status = locked
    ? `Locked · ${item.dropDate ? `drops ${formatDate(item.dropDate)}` : 'drop date TBA'}`
    : playing
      ? `Slideshow · ${photo.label}`
      : 'Collected · in hand'

  return (
    <section
      aria-label="Now playing"
      className="px-6 pt-4 pb-8 sm:px-8"
      style={{ backgroundColor: item.colors.headerTint }}
    >
      <div className="mx-auto flex max-w-md flex-col gap-5">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/merch"
            aria-label="Back to merch"
            className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-merch-ink"
          >
            <ChevronDown />
          </Link>
          <p className="min-w-0 text-center text-xs leading-tight">
            <span className="block font-bold tracking-wide uppercase">Playing from merch</span>
            <span className="block truncate font-bold text-merch-muted">nnnoo</span>
          </p>
          <details className="relative">
            <summary
              aria-label="More options"
              className="-mr-2 grid size-11 cursor-pointer list-none place-items-center rounded-full hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-merch-ink [&::-webkit-details-marker]:hidden"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-current">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </summary>
            <ul className="absolute right-0 z-10 mt-1 w-48 rounded-merch bg-white p-1 text-sm font-bold shadow-xl">
              <li>
                <Link href="/merch" className="flex min-h-11 items-center rounded-[6px] px-3 hover:bg-merch-surface">
                  All merch
                </Link>
              </li>
              {item.albumSlug && (
                <li>
                  <Link
                    href={`/album/${item.albumSlug}`}
                    className="flex min-h-11 items-center rounded-[6px] px-3 hover:bg-merch-surface"
                  >
                    Go to album
                  </Link>
                </li>
              )}
            </ul>
          </details>
        </div>

        {/* Art */}
        <div className="relative aspect-square w-full overflow-hidden rounded-merch shadow-2xl">
          {locked ? (
            <div className="flex size-full flex-col items-center justify-center gap-5 bg-merch-locked p-4 text-white">
              <LockIcon className="size-12 text-merch-pink" />
              {item.dropDate ? (
                <Countdown date={item.dropDate} />
              ) : (
                <p className="font-bold">Drop date TBA</p>
              )}
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.src}
              alt={photo.alt}
              className="size-full object-cover"
              style={{ backgroundColor: item.colors.artBg }}
            />
          )}
          <span
            className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-merch-ink"
          >
            {locked ? 'Locked · no photos yet' : photo.label}
          </span>
        </div>

        {/* Title + want */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-black break-words">{item.name}</h1>
            <p className="text-sm text-merch-muted">nnnoo · {MERCH_TYPE_LABEL[item.type]}</p>
          </div>
          <button
            type="button"
            aria-pressed={wanted}
            aria-label="Want this"
            onClick={() => setWanted((w) => !w)}
            className={`grid size-11 shrink-0 place-items-center rounded-full hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-merch-ink ${
              wanted ? 'text-merch-pink-ink' : 'text-merch-ink'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className={`size-7 stroke-current stroke-2 ${wanted ? 'fill-current' : 'fill-none'}`}
            >
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Progress = slideshow position */}
        <div>
          <div
            role="progressbar"
            aria-label="Photo"
            aria-valuemin={locked ? 0 : 1}
            aria-valuemax={photos.length}
            aria-valuenow={locked ? 0 : index + 1}
            className="h-1 overflow-hidden rounded-full bg-black/15"
          >
            <div
              className="h-full rounded-full bg-merch-ink transition-[width]"
              style={{ width: locked ? '0%' : `${((index + 1) / photos.length) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-merch-muted tabular-nums">
            <span>{locked ? 'No photos' : `Photo ${index + 1}`}</span>
            <span>of {photos.length}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Shuffle: random other item"
            onClick={shuffle}
            disabled={otherSlugs.length === 0}
            className={CONTROL}
          >
            <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-none stroke-current stroke-2">
              <path d="M16 4h4v4M4 20 20 4M20 16v4h-4M15 15l5 5M4 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <Link href={`/merch/${prevSlug}`} aria-label="Previous item" className={CONTROL}>
            <svg viewBox="0 0 24 24" aria-hidden className="size-7 fill-current">
              <path d="M6 5h2v14H6zM20 5v14L9 12z" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            disabled={locked}
            aria-label={playing ? 'Pause photos' : 'Play photos'}
            className="grid size-16 place-items-center rounded-full bg-merch-ink text-white transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merch-ink disabled:opacity-40 disabled:hover:scale-100"
          >
            {playing ? (
              <svg viewBox="0 0 24 24" aria-hidden className="size-7 fill-current">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden className="size-7 fill-current">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <Link href={`/merch/${nextSlug}`} aria-label="Next item" className={CONTROL}>
            <svg viewBox="0 0 24 24" aria-hidden className="size-7 fill-current">
              <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
            </svg>
          </Link>
          {/* Spacer keeps Play centred, like Spotify's repeat slot. */}
          <span aria-hidden className="size-11" />
        </div>

        <p className="flex justify-between gap-4 text-sm">
          <span className="font-bold">{status}</span>
          <span className="shrink-0 text-merch-muted">
            Item {position} of {total}
          </span>
        </p>
      </div>
    </section>
  )
}

const CONTROL =
  'grid size-11 place-items-center rounded-full text-merch-ink hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-merch-ink disabled:opacity-40'

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-none stroke-current stroke-2">
      <path d="m5 9 7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
