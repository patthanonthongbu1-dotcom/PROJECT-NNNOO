import type { MetadataRoute } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
  .replace(/\/+$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The admin panel is behind auth anyway; keep it out of the index too.
      disallow: '/admin',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
