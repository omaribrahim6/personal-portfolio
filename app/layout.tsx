import type { Metadata, Viewport } from 'next'
import { Instrument_Sans, Instrument_Serif, Martian_Mono, Unbounded } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

// Heliotrope, the site's own display face: wide stencil capitals in one heavy stroke, like the lettering on
// a retro-futurist expo poster. Made by scripts/heliotrope.mjs. The line cut is a hairline down the middle of
// every stroke, laid over the solid in a second colour; the light cut is the same skeletons, drawn thin, for page numbers.
// All three are a few kilobytes, so they block rather than swap: the line cut drawn in a stand-in face over
// the solid one would be worse than a moment without the words.
const heliotrope = localFont({ src: './fonts/heliotrope.woff', variable: '--font-heliotrope', display: 'block' })
const heliotropeLine = localFont({ src: './fonts/heliotrope-line.woff', variable: '--font-heliotrope-line', display: 'block', adjustFontFallback: false })
const heliotropeLight = localFont({ src: './fonts/heliotrope-light.woff', variable: '--font-heliotrope-light', display: 'block' })

// Round, wide and confident: the second voice, for titles inside a section.
const unbounded = Unbounded({ subsets: ['latin'], variable: '--font-unbounded', display: 'swap' })

const instrumentSans = Instrument_Sans({ subsets: ['latin'], axes: ['wdth'], variable: '--font-instrument', display: 'swap' })

// The editorial italic, for the asides.
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument-serif', display: 'swap' })

// Captions, counts and receipts: a wide technical mono, like the small print on a spec sheet.
const martian = Martian_Mono({ subsets: ['latin'], axes: ['wdth'], variable: '--font-martian', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://omaribrahim.me'),
  title: 'Omar Ibrahim — Developer & Security Auditor',
  description:
    'Software Engineering student at Carleton University. Hackathon winner, CTF competitor, and IEEE Engineer of the Year — building AI systems and breaking them before someone else does.',
  keywords: [
    'Omar Ibrahim',
    'software engineer',
    'security auditor',
    'penetration testing',
    'Carleton University',
    'Ottawa',
    'developer portfolio',
    'CTF',
    'hackathon',
  ],
  authors: [{ name: 'Omar Ibrahim', url: 'https://omaribrahim.me' }],
  creator: 'Omar Ibrahim',
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/OI-favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Omar Ibrahim — Developer & Security Auditor',
    description:
      'Software Engineering student at Carleton University. Hackathon winner, CTF competitor, and IEEE Engineer of the Year.',
    url: 'https://omaribrahim.me',
    siteName: 'Omar Ibrahim',
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Omar Ibrahim — Developer & Security Auditor',
    description:
      'Software Engineering student at Carleton University. Hackathon winner, CTF competitor, and IEEE Engineer of the Year.',
  },
}

export const viewport: Viewport = {
  themeColor: '#f5edda',
  colorScheme: 'light',
}

const fonts = [heliotrope, heliotropeLine, heliotropeLight, unbounded, instrumentSans, instrumentSerif, martian].map(font => font.variable).join(' ')

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={fonts}>
      <body>
        {children}
      </body>
    </html>
  )
}
