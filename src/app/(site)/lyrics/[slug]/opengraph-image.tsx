import { ImageResponse } from 'next/og'
import { getTrackBySlug } from '@/lib/queries'

export const alt = 'Lyrics'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // A share card is never worth a 500: an unknown slug just gets the plain one.
  const track = await getTrackBySlug(slug).catch(() => null)

  const title = track?.title ?? 'Lyrics'
  const footer = track
    ? [track.album?.title, track.album?.artist?.name].filter(Boolean).join(' · ')
    : ''

  return new ImageResponse(
    (
      // Satori only implements flexbox and a subset of CSS -- no grid, no
      // Tailwind, and every container of several children says display: flex.
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: 80,
          backgroundImage: 'linear-gradient(135deg, #121212 0%, #000000 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: 72,
            height: 10,
            borderRadius: 9999,
            backgroundColor: '#1db954',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 28, letterSpacing: 6, color: '#b3b3b3' }}>
            LYRICS
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: titleSize(title),
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            {clamp(title, 70)}
          </div>
        </div>

        <div style={{ fontSize: 30, color: '#b3b3b3' }}>{clamp(footer, 80)}</div>
      </div>
    ),
    size
  )
}

/** Long titles step down so they stay on two lines at 1200x630. */
function titleSize(title: string): number {
  if (title.length > 40) return 64
  if (title.length > 22) return 80
  return 96
}

function clamp(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}
