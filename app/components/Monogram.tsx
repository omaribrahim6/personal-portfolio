// The almanac's mark: his initials on a small sun, in the stencil face, with its rays drawn round it.
export default function Monogram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <g stroke="var(--color-ink)" strokeWidth="2.2" strokeLinecap="round">
        {Array.from({ length: 12 }, (_, k) => <path key={k} d="M24 2.6v4.2" transform={`rotate(${k * 30} 24 24)`} />)}
      </g>
      <circle cx="24" cy="24" r="15.5" fill="var(--color-sun)" stroke="var(--color-ink)" strokeWidth="2.2" />
      <text x="24" y="29.2" textAnchor="middle" fill="var(--color-ink)" style={{ font: '15px var(--font-display)', letterSpacing: '.02em' }}>OI</text>
    </svg>
  )
}
