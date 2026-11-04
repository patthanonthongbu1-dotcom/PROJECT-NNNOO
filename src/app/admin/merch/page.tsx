import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getMerch } from '@/lib/queries'
import { MERCH_TYPE_LABEL } from '@/lib/merch'
import { MerchForm } from '@/components/admin/MerchForm'

export const metadata: Metadata = {
  title: 'Merch',
}

export default async function AdminMerchPage() {
  await requireAdmin()

  const supabase = await createClient()
  const [merch, albumsResult] = await Promise.all([
    getMerch(),
    supabase.from('albums').select('id, title').order('release_date', { ascending: false, nullsFirst: false }),
  ])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black text-ink">Merch</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {merch.length} item{merch.length === 1 ? '' : 's'}. Not for sale, just for show.
        </p>
      </div>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="mb-4 text-lg font-bold text-ink">Items</h2>

        {merch.length === 0 ? (
          <p className="text-sm text-ink-faint">No merch yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {merch.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/merch/${item.id}`}
                  className="flex items-center gap-4 rounded px-2 py-3 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {item.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photos[0].src}
                      alt=""
                      className="size-12 shrink-0 rounded object-cover"
                      style={{ backgroundColor: item.colors.artBg }}
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="size-12 shrink-0 rounded"
                      style={{ backgroundColor: item.colors.artBg }}
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{item.name}</span>
                    <span className="block truncate text-xs text-ink-faint">
                      {[
                        MERCH_TYPE_LABEL[item.type],
                        item.status === 'locked' ? 'Locked' : 'Collected',
                        item.isLatestDrop && 'Latest drop',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="mb-1 text-lg font-bold text-ink">New merch</h2>
        <p className="mb-4 text-sm text-ink-muted">Only a name is required.</p>
        <MerchForm albums={albumsResult.data ?? []} />
      </section>
    </div>
  )
}
