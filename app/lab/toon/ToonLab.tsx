'use client'

import { useEffect, useState } from 'react'
import Diorama, { type SceneName } from '../../components/toon/Diorama'

/** `?scene=cover`, `?state=open`, `?w=900&h=600` for a fixed size. */
export default function ToonLab() {
  const [query, setQuery] = useState<{ scene: SceneName; state?: string; w?: number; h?: number } | null>(null)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the bench starts from whatever the address asks for
    setQuery({ scene: (q.get('scene') ?? 'cover') as SceneName, state: q.get('state') ?? undefined, w: Number(q.get('w')) || undefined, h: Number(q.get('h')) || undefined })
  }, [])
  if (!query) return null
  return (
    <main style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', background: '#f3ead6' }}>
      <Diorama scene={query.scene} state={query.state}
        className="lab-diorama" />
      <style>{`.lab-diorama { display: block; width: ${query.w ? query.w + 'px' : '100vw'}; height: ${query.h ? query.h + 'px' : '100svh'}; }`}</style>
    </main>
  )
}
