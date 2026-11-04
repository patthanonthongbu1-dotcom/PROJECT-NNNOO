import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { deleteMerch } from '@/lib/actions'
import { merchFromRow, type MerchRow } from '@/lib/merch'
import { MerchForm } from '@/components/admin/MerchForm'
import { ActionButton } from '@/components/admin/ActionButton'

export async function generateMetadata({ params }: PageProps<'/admin/merch/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('merch').select('name').eq('id', id).maybeSingle()
  return { title: data?.name ?? 'Merch' }
}

export default async function AdminMerchItemPage({ params }: PageProps<'/admin/merch/[id]'>) {
  await requireAdmin()
  const { id } = await params

  const supabase = await createClient()
  const [itemResult, albumsResult] = await Promise.all([
    supabase.from('merch').select('*, album:albums(slug)').eq('id', id).maybeSingle(),
    supabase.from('albums').select('id, title').order('release_date', { ascending: false, nullsFirst: false }),
  ])

  if (!itemResult.data) notFound()
  const item = merchFromRow(itemResult.data as MerchRow)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/merch"
          className="text-sm font-bold text-ink-muted transition-colors hover:text-ink"
        >
          ← Merch
        </Link>
        <h1 className="text-3xl font-black text-ink">{item.name}</h1>
        <p className="text-sm text-ink-muted">
          Public at{' '}
          <Link href={`/merch/${item.slug}`} className="text-accent underline-offset-4 hover:underline">
            /merch/{item.slug}
          </Link>
        </p>
      </div>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="mb-4 text-lg font-bold text-ink">Details</h2>
        <MerchForm item={item} albums={albumsResult.data ?? []} />
      </section>

      <section className="rounded-card border border-red-950 bg-surface p-5">
        <h2 className="text-lg font-bold text-ink">Danger zone</h2>
        <p className="mt-1 mb-4 text-sm text-ink-muted">
          Removes this item from the site. Uploaded photos stay in storage.
        </p>
        <ActionButton
          action={deleteMerch}
          fields={{ id: item.id }}
          variant="danger"
          pendingLabel="Deleting…"
          confirm={`Delete "${item.name}"? This cannot be undone.`}
        >
          Delete item
        </ActionButton>
      </section>
    </div>
  )
}
