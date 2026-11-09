import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Expunge: DIY Credit Dispute Letters',
    short_name: 'Expunge',
    description: 'Review your credit report for possible errors and draft dispute letters you mail yourself.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F5F7',
    theme_color: '#F5F5F7',
    icons: [
      { src: '/icon.svg', sizes: '80x80', type: 'image/svg+xml' },
      { src: '/app-icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
      { src: '/app-icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
