import type { Metadata, Viewport } from 'next'
import { Fraunces, Hanken_Grotesk, Michroma } from 'next/font/google'
import './globals.css'

// A soft, slightly odd serif for the big words, in the spirit of a painted paperback cover.
const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz', 'SOFT', 'WONK'],
  variable: '--font-fraunces',
  display: 'swap',
})

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
})

// Wide, squared capitals for captions and coordinates.
const michroma = Michroma({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-michroma',
  display: 'swap',
})

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
  themeColor: '#11123a',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable} ${michroma.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
