import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    // Use the environment variable for the base URL, or a default placeholder
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://assistra.app'

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 1,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/register`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        }
    ]
}
