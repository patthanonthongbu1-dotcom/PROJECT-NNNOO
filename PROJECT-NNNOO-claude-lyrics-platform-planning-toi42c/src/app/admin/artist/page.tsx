import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ArtistForm } from '@/components/admin/ArtistForm'
import type { Artist } from '@/lib/database.types'

export const metadata: Metadata = {
  title: 'Artist',
}

export default async function AdminArtistPage() {
  await requireAdmin()

  const supabase = await createClient()
  // The site has one artist; whichever row exists is it.
  const { data } = await supabase
    .from('artists')
    .select('*')
    .order('created_at')
    .limit(1)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black text-ink">Artist</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The profile behind every album and track on the site.
        </p>
      </div>

      <div className="rounded-card border border-line bg-surface p-5">
        <ArtistForm artist={data as Artist | null} />
      </div>
    </div>
  )
}
