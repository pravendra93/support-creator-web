import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    // Use the environment variable for the base URL, or a default placeholder
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://assistra.app'

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/dashboard/',
                '/settings/',
                '/me/',
                '/pages/',
                '/preview-embed/'
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
