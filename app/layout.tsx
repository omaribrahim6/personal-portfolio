import type { Metadata } from 'next'
import { Inter, Bebas_Neue } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bebasNeue.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}

