// The pod in the corner: a little round house of the kind painted all over the site, with one big brass
// porthole. Omar leans out of it. It is drawn in two layers so he can be between them: the shell, the roof and
// the glass behind him, and the lower half of the rim and the vines in front of him.

const RIVETS = Array.from({ length: 16 }, (_, k) => k / 16 * Math.PI * 2 + .2)

export function PodBack({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <linearGradient id="pod-shell" x1="0" y1="0" x2="1" y2=".5">
          <stop offset="0" stopColor="#fffbf1" />
          <stop offset=".5" stopColor="#f2eadb" />
          <stop offset="1" stopColor="#cfc4b2" />
        </linearGradient>
        <radialGradient id="pod-glass" cx=".38" cy=".3" r=".8">
          <stop offset="0" stopColor="#d9f6ee" />
          <stop offset=".45" stopColor="#7cc8c0" />
          <stop offset="1" stopColor="#24575e" />
        </radialGradient>
        <radialGradient id="pod-room" cx=".5" cy=".85" r=".7">
          <stop offset="0" stopColor="#ffd98a" stopOpacity=".95" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pod-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6d894" />
          <stop offset=".5" stopColor="#c39345" />
          <stop offset="1" stopColor="#6b4c1f" />
        </linearGradient>
        <linearGradient id="pod-panel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fa8ec" />
          <stop offset="1" stopColor="#1c3488" />
        </linearGradient>
      </defs>
      {/* A soft shadow on whatever is behind, then the shell, running off the edge of the screen. */}
      <path d="M-40 212C-44 112 22 22 128 8C168 3 200 8 228 16V212Z" fill="rgba(10,30,20,.16)" />
      <path d="M-30 206C-34 116 28 30 128 17C164 12 196 16 216 24V206Z" fill="url(#pod-shell)" stroke="#16261f" strokeWidth="3" strokeLinejoin="round" />
      <path d="M-14 132C6 78 54 40 120 28" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="6" strokeLinecap="round" opacity=".7" />
      <path d="M22 206C22 150 40 106 70 80M168 22C184 60 192 130 194 206" fill="none" stroke="rgba(22,38,31,.18)" strokeWidth="1.6" />
      {/* A small porthole up on the shoulder, lit. */}
      <circle cx="22" cy="104" r="11" fill="url(#pod-brass)" stroke="#16261f" strokeWidth="1.6" />
      <circle cx="22" cy="104" r="7.5" fill="#ffd98a" stroke="#3f2d12" strokeWidth="1.2" />
      {/* A band of turquoise round its foot. */}
      <path d="M-31 186C10 172 110 166 216 168V182C110 180 14 188 -30 200Z" fill="#7fd6c6" stroke="#16261f" strokeWidth="2" strokeLinejoin="round" />
      {/* A panel on the roof, tilted to the sun. */}
      <g transform="rotate(-6 176 8)">
        <rect x="150" y="-4" width="52" height="24" rx="1.5" fill="url(#pod-panel)" stroke="#e9eef4" strokeWidth="2" />
        <path d="M163 -4v24M176 -4v24M189 -4v24M150 8h52" stroke="rgba(200,220,255,.55)" strokeWidth="1" />
        <path d="M156 -4l10 24h6l-10-24Z" fill="rgba(255,255,255,.35)" />
        <path d="M162 20l-2 6M192 20l2 6" stroke="#3d4a46" strokeWidth="2.4" strokeLinecap="round" />
      </g>
      {/* The antenna, and the lamp on it that says whether he can answer. */}
      <path d="M48 46 40 4" stroke="#16261f" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M43 22 32 23M45 32 36 33" stroke="#16261f" strokeWidth="1.8" strokeLinecap="round" />
      <circle className="lamp" cx="39.6" cy="2" r="5.4" stroke="#16261f" strokeWidth="1.6" />
      {/* The porthole: brass rim and rivets, then the glass with the room lit behind it. */}
      <circle cx="104" cy="122" r="64" fill="url(#pod-brass)" stroke="#16261f" strokeWidth="2.4" />
      <circle cx="104" cy="122" r="56.5" fill="#3f2d12" />
      <circle cx="104" cy="122" r="54" fill="url(#pod-glass)" />
      <circle cx="104" cy="122" r="54" fill="url(#pod-room)" />
      {RIVETS.map(a => <circle key={a} cx={104 + Math.cos(a) * 60.2} cy={122 + Math.sin(a) * 60.2} r="1.9" fill="#5a3f17" />)}
    </svg>
  )
}

export function PodFront({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <clipPath id="pod-lower"><rect x="0" y="122" width="220" height="100" /></clipPath>
      </defs>
      {/* The lower half of the rim, in front of him. */}
      <g clipPath="url(#pod-lower)">
        <circle cx="104" cy="122" r="60" fill="none" stroke="url(#pod-brass)" strokeWidth="8.5" />
        <circle cx="104" cy="122" r="64" fill="none" stroke="#16261f" strokeWidth="2.4" />
        <circle cx="104" cy="122" r="55.8" fill="none" stroke="#3f2d12" strokeWidth="2" />
        {RIVETS.map(a => <circle key={a} cx={104 + Math.cos(a) * 60.2} cy={122 + Math.sin(a) * 60.2} r="1.9" fill="#5a3f17" />)}
      </g>
      {/* A glint on the glass, low down, where he is not. */}
      <path d="M62 150A46 46 0 0 0 82 168" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="4" strokeLinecap="round" />
      {/* Vines down the side of the shell, a few leaves hanging in front. */}
      <g className="vines">
        <path d="M-6 92C-14 116 -16 140 -10 166M10 70C4 88 6 104 14 118M66 48C60 60 60 70 64 80" fill="none" stroke="#2b5c35" strokeWidth="2" strokeLinecap="round" />
        {[[-8, 102, -30], [-14, 118, 30], [-12, 136, -20], [-9, 154, 25], [8, 80, 35], [6, 94, -25], [12, 108, 30], [64, 58, 20], [61, 70, -30]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx="6.4" ry="3.6" transform={`rotate(${r} ${x} ${y})`} fill={i % 3 ? '#5d9a4a' : '#9ccb5e'} stroke="#16261f" strokeWidth="1.2" />
        ))}
      </g>
    </svg>
  )
}
