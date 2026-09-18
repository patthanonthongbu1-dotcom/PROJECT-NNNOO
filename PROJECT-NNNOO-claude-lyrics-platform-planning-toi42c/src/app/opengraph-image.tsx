import { ImageResponse } from 'next/og'
import { getArtist } from '@/lib/queries'

export const alt = 'Lyrics'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** The fallback card, used for every route without one of its own. */
export default async function Image() {
  const artist = await getArtist().catch(() => null)
  const title = artist?.name ?? 'Lyrics'

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

        <div
          style={{
            fontSize: title.length > 22 ? 80 : 96,
            fontWeight: 800,
            lineHeight: 1.1,
          }}
        >
          {title.length > 70 ? `${title.slice(0, 69).trimEnd()}…` : title}
        </div>

        <div style={{ fontSize: 30, color: '#b3b3b3' }}>
          Lyrics, credits and liner notes
        </div>
      </div>
    ),
    size
  )
}
