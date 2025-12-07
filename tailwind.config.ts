import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#1a1a1a',
          secondary: '#2a2a2a',
          tertiary: '#404040',
        },
        light: {
          primary: '#e5e5e5',
          secondary: '#b0b0b0',
        },
        accent: {
          yellow: '#FFD700',
          'yellow-dark': '#FFC700',
        },
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      letterSpacing: {
        'extra-wide': '0.05em',
      },
    },
  },
  plugins: [],
}
export default config

