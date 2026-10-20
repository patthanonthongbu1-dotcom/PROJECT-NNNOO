import { parseProse } from '@/lib/format'

/** Long-form plain text (bios, "About this song") as paragraphs and headings. */
export function Prose({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-4 leading-relaxed text-ink-muted">
      {parseProse(text).map((block, i) =>
        block.kind === 'heading' ? (
          <h3 key={i} className="mt-2 text-lg font-bold text-ink">
            {block.text}
          </h3>
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            {block.text}
          </p>
        )
      )}
    </div>
  )
}
