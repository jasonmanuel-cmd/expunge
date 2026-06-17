import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Expunge — AI Credit Dispute Automation',
    short_name: 'Expunge',
    description: 'Analyze credit reports, draft FCRA-compliant dispute letters, and file with all three bureaus automatically.',
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
