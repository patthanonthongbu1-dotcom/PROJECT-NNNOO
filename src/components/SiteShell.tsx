import { getAlbums, getArtist } from '@/lib/queries'
import { Sidebar } from './Sidebar'

/**
 * Two-column app frame: a fixed sidebar and a scrolling content pane, the
 * way Spotify's web player is laid out. Below `lg` the sidebar drops away
 * and the nav lives in the content flow instead.
 */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [artist, albums] = await Promise.all([getArtist(), getAlbums()])

  return (
    <div className="flex min-h-dvh gap-2 bg-base p-2">
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-2 h-[calc(100dvh-1rem)]">
          <Sidebar artist={artist} albums={albums} />
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-hidden rounded-card bg-gradient-to-b from-surface to-base">
        {children}
      </main>
    </div>
  )
}
