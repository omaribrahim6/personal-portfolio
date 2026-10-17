/** How far through the day an hour is, from sunrise (06:00) to sunset (19:00). */
export const dayAt = (hour: string) => {
  const [h, m] = hour.split(':').map(Number)
  return Math.min(1, Math.max(0, (h + m / 60 - 6) / 13))
}

/** A small sundial: the horizon, the sun's arc, and the sun at `at` of the way along it (0 rising, 1 setting). */
export default function SunDial({ at, className }: { at: number; className?: string }) {
  const p = Math.min(1, Math.max(0, at))
  const x = 14 - 10.5 * Math.cos(Math.PI * p), y = 14 - 10.5 * Math.sin(Math.PI * p)
  return (
    <svg className={className} viewBox="0 0 28 16" aria-hidden="true">
      <path d="M3.5 14A10.5 10.5 0 0 1 24.5 14" fill="none" stroke="currentColor" strokeOpacity=".4" strokeDasharray="1.4 1.8" />
      <path d="M1 14.5H27" stroke="currentColor" strokeOpacity=".7" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx={x.toFixed(2)} cy={y.toFixed(2)} r="4.4" fill="var(--color-sun)" opacity=".28" />
      <circle cx={x.toFixed(2)} cy={y.toFixed(2)} r="2.7" fill="var(--color-sun)" stroke="rgba(22,38,31,.5)" strokeWidth=".6" />
    </svg>
  )
}
