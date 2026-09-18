import { getAlbums, getArtist } from '@/lib/queries'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { FloatingEditToggle } from './edit/EditModeToggle'

/**
 * Two-column app frame: a fixed sidebar and a scrolling content pane, the
 * way Spotify's web player is laid out. Below `lg` the sidebar drops away
 * and the bottom tab bar takes over.
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

      {/* The bottom padding is the tab bar's height plus the home indicator:
          without it the last line of a song sits underneath the bar. */}
      <main className="min-w-0 flex-1 overflow-hidden rounded-card bg-gradient-to-b from-surface to-base pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>

      <MobileNav artistSlug={artist?.slug ?? null} />
      <FloatingEditToggle />
    </div>
  )
}
