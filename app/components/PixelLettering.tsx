import { NAME_PIXELS } from './pixelFont'
import styles from './PixelExperience.module.css'

type Props = {
  // blueprint: faint outlines while the scene loads. solid: readable blocks when WebGL is unavailable.
  mode: 'blueprint' | 'solid'
  visible: boolean
}

// The viewBox mirrors the scene camera: 21.6 units tall on wide stages, 48 units wide on narrow ones,
// so the static blocks sit where the cubes will land.
export default function PixelLettering({ mode, visible }: Props) {
  return (
    <svg className={`${styles.lettering} ${mode === 'solid' ? styles.solid : styles.blueprint}`} data-visible={visible}
      viewBox="-24 -10.8 48 21.6" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {NAME_PIXELS.map(({ x, y }, index) => (
        <g key={index}>
          {mode === 'solid' && <rect x={x - .435 + .12} y={-y - .435 + .16} width=".87" height=".87" rx=".06" fill="#8b7426" />}
          <rect x={x - .435} y={-y - .435} width=".87" height=".87" rx=".06" />
        </g>
      ))}
    </svg>
  )
}
