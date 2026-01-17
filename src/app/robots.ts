import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://staminatimer.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/guides',
          '/guides/*',
          '/faq',
          '/login',
          '/privacy',
          '/terms',
          '/license',
        ],
        disallow: [
          '/api/',
          '/auth/',
          '/dashboard',
          '/training',
          '/progress',
          '/settings',
          '/ai-coach',
          '/share/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
