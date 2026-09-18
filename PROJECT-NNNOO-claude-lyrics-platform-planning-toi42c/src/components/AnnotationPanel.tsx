'use client'

import { useActionState, useEffect, useRef } from 'react'
import {
  createAnnotation,
  deleteAnnotation,
  updateAnnotation,
  type ActionState,
} from '@/lib/actions'
import type { ReaderAnnotation } from '@/lib/annotations'
import { ChevronIcon, CloseIcon } from './icons'

/** What the panel is showing: an existing note, or one being written. */
export type PanelContent =
  | {
      kind: 'note'
      note: ReaderAnnotation
      /** Read out of the lyrics — the reader is never sent the stored quotes. */
      quote: string
      index: number
      total: number
    }
  | { kind: 'compose'; quote: string; start: number; end: number }

interface PanelProps {
  content: PanelContent | null
  trackId: string
  editing: boolean
  hasNotes: boolean
  onClose: () => void
  onStep: (delta: number) => void
}

/**
 * The note: beside the lyrics on a wide screen, over them on a narrow one.
 *
 * Both presentations render the same card. The sheet stays mounted and slides
 * out of view when closed, so opening one is a movement rather than a flash,
 * and it is deliberately not a modal dialog — reading on while a note is open
 * is the entire point of annotating a lyric.
 */
export function AnnotationPanel(props: PanelProps) {
  return (
    <>
      <aside className="hidden lg:sticky lg:top-6 lg:block" aria-label="Annotation">
        {props.content ? (
          <NoteCard {...props} content={props.content} />
        ) : props.hasNotes ? (
          <p className="rounded-card border border-dashed border-line p-4 text-sm text-ink-faint">
            Highlighted lines have notes. Click one to read it.
          </p>
        ) : null}
      </aside>

      <div className="lg:hidden">
        <div
          aria-hidden
          onClick={props.onClose}
          className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 ${
            props.content ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
        <div
          role="region"
          aria-label="Annotation"
          aria-hidden={props.content ? undefined : true}
          className={`fixed inset-x-0 bottom-0 z-50 max-h-[70dvh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl transition-transform duration-200 ${
            props.content ? 'translate-y-0' : 'pointer-events-none translate-y-full'
          }`}
        >
          {/* The grab handle people expect at the top of a sheet. */}
          <span
            aria-hidden
            className="mx-auto mb-3 block h-1 w-10 rounded-full bg-surface-3"
          />
          {props.content && <NoteCard {...props} content={props.content} />}
        </div>
      </div>
    </>
  )
}

function NoteCard({
  content,
  trackId,
  editing,
  onClose,
  onStep,
}: PanelProps & { content: PanelContent }) {
  const headingRef = useRef<HTMLParagraphElement>(null)

  // Moving focus into the card is what makes the keyboard and a screen reader
  // follow the click into the note instead of staying back in the lyrics.
  useEffect(() => {
    headingRef.current?.focus()
  }, [content])

  return (
    <div className="rounded-card border border-line bg-surface p-4 lg:shadow-xl lg:shadow-black/20">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p
          ref={headingRef}
          tabIndex={-1}
          className="text-xs font-bold tracking-wide text-ink-muted uppercase outline-none"
        >
          {content.kind === 'compose'
            ? 'New note'
            : `Note ${content.index + 1} of ${content.total}`}
        </p>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close annotation"
          className="-mt-1 -mr-1 rounded p-1 text-ink-faint transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
        >
          <CloseIcon />
        </button>
      </div>

      <blockquote className="border-l-2 border-highlight-ink pl-3 text-sm whitespace-pre-wrap text-highlight-ink/90 italic">
        {content.quote}
      </blockquote>

      {content.kind === 'compose' ? (
        <ComposeForm
          trackId={trackId}
          quote={content.quote}
          start={content.start}
          end={content.end}
          onDone={onClose}
        />
      ) : editing ? (
        <EditNoteForm note={content.note} trackId={trackId} onDeleted={onClose} />
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-ink">
            {content.note.body}
          </p>
          <Stepper
            index={content.index}
            total={content.total}
            noteId={content.note.id}
            onStep={onStep}
          />
        </>
      )}
    </div>
  )
}

/** Previous / next, plus the link that makes one note shareable on its own. */
function Stepper({
  index,
  total,
  noteId,
  onStep,
}: {
  index: number
  total: number
  noteId: string
  onStep: (delta: number) => void
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <StepButton
          label="Previous note"
          disabled={total < 2}
          onClick={() => onStep(-1)}
          flip
        />
        <StepButton
          label="Next note"
          disabled={total < 2}
          onClick={() => onStep(1)}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          const url = `${window.location.origin}${window.location.pathname}#note-${noteId}`
          void navigator.clipboard?.writeText(url)
        }}
        className="text-xs font-bold text-ink-faint transition-colors hover:text-ink"
      >
        Copy link
      </button>

      <span className="sr-only">
        Note {index + 1} of {total}
      </span>
    </div>
  )
}

function StepButton({
  label,
  disabled,
  onClick,
  flip = false,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  flip?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded-full border border-line p-1.5 text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
    >
      <ChevronIcon className={`size-4 ${flip ? 'rotate-180' : ''}`} />
    </button>
  )
}

function ComposeForm({
  trackId,
  quote,
  start,
  end,
  onDone,
}: {
  trackId: string
  quote: string
  start: number
  end: number
  onDone: () => void
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createAnnotation,
    { status: 'idle' }
  )

  useEffect(() => {
    if (state.status === 'success') onDone()
  }, [state, onDone])

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <input type="hidden" name="track_id" value={trackId} />
      <input type="hidden" name="start_offset" value={start} />
      <input type="hidden" name="end_offset" value={end} />
      <input type="hidden" name="quote" value={quote} />

      <label htmlFor="new-annotation" className="sr-only">
        Annotation
      </label>
      <textarea
        id="new-annotation"
        name="body"
        rows={5}
        required
        autoFocus
        placeholder="What does this line mean, refer to, or sample?"
        className="w-full rounded border border-line bg-surface-2 px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-faint focus:border-accent focus:outline-2 focus:outline-offset-1 focus:outline-accent"
      />

      <Message state={state} />

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save note'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-2 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function EditNoteForm({
  note,
  trackId,
  onDeleted,
}: {
  note: ReaderAnnotation
  trackId: string
  onDeleted: () => void
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateAnnotation,
    { status: 'idle' }
  )
  const [deleteState, deleteAction, deleting] = useActionState<
    ActionState,
    FormData
  >(deleteAnnotation, { status: 'idle' })

  useEffect(() => {
    if (deleteState.status === 'success') onDeleted()
  }, [deleteState, onDeleted])

  return (
    <div className="mt-3 flex flex-col gap-3">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={note.id} />
        <input type="hidden" name="track_id" value={trackId} />

        <label htmlFor={`note-body-${note.id}`} className="sr-only">
          Annotation
        </label>
        {/* Keyed on the note, so stepping to the next one loads its text
            instead of carrying the previous note's draft across. */}
        <textarea
          key={note.id}
          id={`note-body-${note.id}`}
          name="body"
          rows={5}
          required
          defaultValue={note.body}
          className="w-full rounded border border-line bg-surface-2 px-3 py-2 text-sm leading-relaxed text-ink focus:border-accent focus:outline-2 focus:outline-offset-1 focus:outline-accent"
        />

        <Message state={state} />

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-accent px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save note'}
        </button>
      </form>

      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (!window.confirm('Delete this annotation?')) event.preventDefault()
        }}
      >
        <input type="hidden" name="id" value={note.id} />
        <input type="hidden" name="track_id" value={trackId} />
        <button
          type="submit"
          disabled={deleting}
          className="text-xs font-bold text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete note'}
        </button>
      </form>
    </div>
  )
}

function Message({ state }: { state: ActionState }) {
  if (state.status !== 'error' || !state.message) return null
  return (
    <p role="alert" className="text-xs text-red-400">
      {state.message}
    </p>
  )
}
