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
  title: 'Omar - Developer Portfolio',
  description: 'A dark, minimalist portfolio showcasing my work as a developer',
  keywords: ['developer', 'portfolio', 'web development', 'software engineer'],
  authors: [{ name: 'Omar' }],
  icons: {
    icon: '/OI-favicon.png',
    shortcut: '/OI-favicon.png',
    apple: '/OI-favicon.png',
  },
  openGraph: {
    title: 'Omar - Developer Portfolio',
    description: 'A dark, minimalist portfolio showcasing my work as a developer',
    type: 'website',
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

