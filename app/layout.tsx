import type { Metadata, Viewport } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import './globals.css'

// Barlow takes after the highway and trail signs of the American west: the condensed cut for anything big, the regular for reading.
const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-barlow',
  display: 'swap',
})
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-barlow-condensed',
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#dad8d0' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1d18' },
  ],
  colorScheme: 'light dark',
}

// The visitor's light or dark pick (see ThemeToggle), back on the page before it paints.
const theme = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: theme }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
