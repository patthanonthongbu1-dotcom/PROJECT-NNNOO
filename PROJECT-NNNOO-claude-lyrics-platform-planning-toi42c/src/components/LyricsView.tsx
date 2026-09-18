'use client'

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  isSectionHeader,
  segmentLyrics,
  type ReaderAnnotation,
} from '@/lib/annotations'
import {
  offsetsFromSelection,
  overlapsExisting,
  trimRange,
  type SelectionRange,
} from '@/lib/selection'
import { useEditMode } from './edit/EditModeProvider'
import { AnnotationPanel, type PanelContent } from './AnnotationPanel'
import { LyricsEditor } from './edit/LyricsEditor'

/**
 * The lyrics, with their annotations.
 *
 * Reading: annotated words carry a standing highlight; opening one puts the
 * note beside the lyrics on a wide screen and over them on a phone, and
 * writes `#note-<id>` so it can be linked to on its own.
 *
 * Editing: the same view, plus the ability to select any words and write a
 * note about them. That is the reason annotating lives here rather than only
 * in the Studio — the offsets an annotation stores are measured against the
 * saved lyrics, and this page renders exactly those.
 */
export function LyricsView({
  trackId,
  lyrics,
  annotations,
}: {
  trackId: string
  lyrics: string
  annotations: ReaderAnnotation[]
}) {
  const { editing } = useEditMode()
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Annotating is measured against the saved text, so it is disabled while
  // the lyrics themselves are open for editing and possibly ahead of it.
  const [editingLyrics, setEditingLyrics] = useState(false)
  const [pending, setPending] = useState<PendingSelection | null>(null)
  const [composing, setComposing] = useState<SelectionRange | null>(null)

  const ordered = useMemo(
    () => [...annotations].sort((a, b) => a.start_offset - b.start_offset),
    [annotations]
  )
  const segments = useMemo(
    () => segmentLyrics(lyrics, ordered),
    [lyrics, ordered]
  )

  const { activeId, setActiveId } = useActiveNote(ordered)
  const activeIndex = ordered.findIndex((note) => note.id === activeId)
  const active = activeIndex === -1 ? null : ordered[activeIndex]

  const close = useCallback(() => {
    setActiveId(null)
    setComposing(null)
  }, [setActiveId])

  const step = useCallback(
    (delta: number) => {
      if (ordered.length === 0) return
      const from = ordered.findIndex((note) => note.id === activeId)
      const next = (from + delta + ordered.length) % ordered.length
      setActiveId(ordered[next].id)
    },
    [activeId, ordered, setActiveId]
  )

  useNoteKeyboard({ open: Boolean(active), onClose: close, onStep: step })
  useScrollNoteIntoView(activeId)
  usePendingSelection({
    enabled: editing && !editingLyrics,
    container: containerRef,
    wrapper: wrapperRef,
    lyrics,
    annotations: ordered,
    onChange: setPending,
  })

  const content: PanelContent | null = composing
    ? { kind: 'compose', quote: composing.quote, start: composing.start, end: composing.end }
    : active
      ? {
          kind: 'note',
          note: active,
          quote: lyrics.slice(active.start_offset, active.end_offset),
          index: activeIndex,
          total: ordered.length,
        }
      : null

  if (!lyrics.trim() && !editing) {
    return <p className="text-ink-faint">No lyrics yet.</p>
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div>
        {editing && (
          <LyricsEditor
            trackId={trackId}
            lyrics={lyrics}
            open={editingLyrics}
            onOpenChange={setEditingLyrics}
            noteCount={ordered.length}
          />
        )}

        {!editingLyrics && (
          <div ref={wrapperRef} className="relative">
            {/*
              Nothing but the lyrics may be rendered inside this element. Its
              text content is what a selection is measured against, so a single
              stray character — a note number, a marker, a space — silently
              shifts every offset after it, and the only symptom is the server
              refusing a selection that plainly does match.
            */}
            <div
              ref={containerRef}
              className="text-lg leading-relaxed whitespace-pre-wrap"
            >
              {segments.map((segment) =>
                segment.annotation ? (
                  <Highlight
                    key={segment.start}
                    id={segment.annotation.id}
                    active={segment.annotation.id === activeId}
                    onOpen={() => {
                      setComposing(null)
                      setActiveId(
                        segment.annotation!.id === activeId
                          ? null
                          : segment.annotation!.id
                      )
                    }}
                  >
                    {renderLines(segment.text)}
                  </Highlight>
                ) : (
                  <Fragment key={segment.start}>
                    {renderLines(segment.text)}
                  </Fragment>
                )
              )}
            </div>

            {pending && (
              <AddNoteButton
                pending={pending}
                onClick={() => {
                  setActiveId(null)
                  setComposing(pending.range)
                  setPending(null)
                  window.getSelection()?.removeAllRanges()
                }}
              />
            )}
          </div>
        )}
      </div>

      <AnnotationPanel
        content={content}
        trackId={trackId}
        editing={editing}
        hasNotes={ordered.length > 0}
        onClose={close}
        onStep={step}
      />
    </div>
  )
}

/**
 * An annotated run of lyrics.
 *
 * A `span` rather than a `button` for two reasons: a button is inline-block,
 * so a highlight spanning a line break would render as one rectangle instead
 * of flowing with the text, and on iOS long-pressing a button raises the
 * callout menu instead of starting a selection — which would make it
 * impossible to annotate words next to an existing note.
 */
function Highlight({
  id,
  active,
  onOpen,
  children,
}: {
  id: string
  active: boolean
  onOpen: () => void
  children: React.ReactNode
}) {
  return (
    <span
      id={`note-${id}`}
      role="button"
      tabIndex={0}
      aria-expanded={active}
      onClick={() => {
        // A click that ends a drag is someone selecting words, not opening a
        // note. Without this, annotating over a highlight is impossible.
        const selection = window.getSelection()
        if (selection && !selection.isCollapsed) return
        onOpen()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onOpen()
      }}
      className={`box-decoration-clone cursor-pointer rounded-sm px-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
        active
          ? 'bg-highlight text-highlight-ink'
          : 'bg-highlight/50 text-highlight-ink/90 hover:bg-highlight hover:text-highlight-ink'
      }`}
    >
      {children}
    </span>
  )
}

/**
 * Section markers like `[Chorus]` are styled apart from the lyric body.
 *
 * The newline belongs *inside* the line it ends, so that every character of
 * the lyrics sits in exactly one text node and none are added between them.
 */
function renderLines(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const content = i < lines.length - 1 ? `${line}\n` : line
    if (content === '') return null
    return isSectionHeader(line) ? (
      <span key={i} className="font-bold text-ink-muted">
        {content}
      </span>
    ) : (
      <Fragment key={i}>{content}</Fragment>
    )
  })
}

interface PendingSelection {
  range: SelectionRange
  /** Where to float the button, relative to the lyrics wrapper. */
  top: number
  left: number
}

/** The button that turns a selection into a note. */
function AddNoteButton({
  pending,
  onClick,
}: {
  pending: PendingSelection
  onClick: () => void
}) {
  return (
    <button
      type="button"
      // Pressing must not steal the selection: on iOS the tap would clear it
      // before the click handler ever runs, and the offsets would be gone.
      onPointerDown={(event) => event.preventDefault()}
      onClick={onClick}
      style={{ top: pending.top, left: pending.left }}
      className="absolute z-20 -translate-x-1/2 -translate-y-full rounded-full bg-accent px-3 py-1.5 text-xs font-bold whitespace-nowrap text-black shadow-lg shadow-black/40 transition-colors hover:bg-accent-hover"
    >
      Add note
    </button>
  )
}

/**
 * Which note is open, kept in step with the address bar.
 *
 * The hash is an external store — someone can arrive on `#note-x`, or follow
 * a link to one while the page is open — so it is read with
 * `useSyncExternalStore` rather than poked at from an effect. Opening a note
 * from a click only rewrites the hash, which is why a click does not feed
 * back through here.
 */
function useActiveNote(annotations: ReaderAnnotation[]) {
  const hash = useSyncExternalStore(subscribeToHash, readHash, () => '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [seenHash, setSeenHash] = useState(hash)

  if (hash !== seenHash) {
    setSeenHash(hash)
    const fromHash = hash.startsWith('#note-') ? hash.slice('#note-'.length) : null
    setSelectedId(
      fromHash && annotations.some((note) => note.id === fromHash) ? fromHash : null
    )
  }

  const setActiveId = useCallback((id: string | null) => {
    setSelectedId(id)
    // `replaceState` rather than assigning `location.hash`: the latter jumps
    // the page to the element, which fights the smooth scroll below.
    const url = id
      ? `#note-${id}`
      : window.location.pathname + window.location.search
    window.history.replaceState(null, '', url)
  }, [])

  return { activeId: selectedId, setActiveId }
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function readHash() {
  return window.location.hash
}

/** Escape closes the note; the arrow keys walk between them. */
function useNoteKeyboard({
  open,
  onClose,
  onStep,
}: {
  open: boolean
  onClose: () => void
  onStep: (delta: number) => void
}) {
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      // Never hijack a key someone is typing into a field.
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return
      }

      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onStep(1)
      if (event.key === 'ArrowLeft') onStep(-1)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, onStep])
}

/** Brings the highlighted words on screen when a note opens from a link. */
function useScrollNoteIntoView(activeId: string | null) {
  useEffect(() => {
    if (!activeId) return
    const span = document.getElementById(`note-${activeId}`)
    if (!span) return

    const box = span.getBoundingClientRect()
    const visible = box.top >= 0 && box.bottom <= window.innerHeight
    if (!visible) span.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeId])
}

/**
 * Watches the selection while editing and reports one worth annotating.
 *
 * `selectionchange` on the document rather than a handler on the lyrics:
 * on iOS the tap that would trigger a `mouseup` handler has already cleared
 * the selection by the time it runs, so the range has to be captured as it
 * is made and kept in state.
 */
function usePendingSelection({
  enabled,
  container,
  wrapper,
  lyrics,
  annotations,
  onChange,
}: {
  enabled: boolean
  container: React.RefObject<HTMLDivElement | null>
  wrapper: React.RefObject<HTMLDivElement | null>
  lyrics: string
  annotations: ReaderAnnotation[]
  onChange: (pending: PendingSelection | null) => void
}) {
  useEffect(() => {
    if (!enabled) {
      onChange(null)
      return
    }

    let timer: ReturnType<typeof setTimeout> | null = null

    function read() {
      const host = container.current
      const frame = wrapper.current
      if (!host || !frame) return onChange(null)

      const selection = window.getSelection()
      const offsets = offsetsFromSelection(host, selection)
      if (!offsets) return onChange(null)

      const range = trimRange(lyrics, offsets.start, offsets.end)
      // A note covering words that already belong to one could never be
      // rendered — the markup is a flat run of spans — so it is refused here
      // rather than saved and silently hidden.
      if (!range || overlapsExisting(annotations, range.start, range.end)) {
        return onChange(null)
      }

      const box = selection!.getRangeAt(0).getBoundingClientRect()
      const frameBox = frame.getBoundingClientRect()
      onChange({
        range,
        top: box.top - frameBox.top - 6,
        left: box.left - frameBox.left + box.width / 2,
      })
    }

    function onSelectionChange() {
      if (timer) clearTimeout(timer)
      // Debounced: the event fires on every character a drag crosses.
      timer = setTimeout(read, 150)
    }

    document.addEventListener('selectionchange', onSelectionChange)
    return () => {
      if (timer) clearTimeout(timer)
      document.removeEventListener('selectionchange', onSelectionChange)
    }
  }, [enabled, container, wrapper, lyrics, annotations, onChange])
}
