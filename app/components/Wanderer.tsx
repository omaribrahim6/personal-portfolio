import styles from './Plate.module.css'

/** The one person in every painting. Small on purpose. The scroll handler moves him along the ground. */
export default function Wanderer() {
  return (
    <span className={styles.wanderer} data-wanderer aria-hidden="true">
      <span className={styles.shadow} />
      <svg viewBox="0 0 20 46">
        <g className={styles.legA}><path d="M6.4 28h3.4l-.3 17.4H6.9z" /></g>
        <g className={styles.legB}><path d="M10.2 28h3.4l-.5 17.4h-2.6z" /></g>
        <path d="M5.2 10.4c.3-1.5 1.6-2.2 3-2.2h3.6c1.4 0 2.7.7 3 2.2l1 9.6c.1.9-.3 1.3-.9 1.3l-.4 9.6H5.5l-.4-9.6c-.6 0-1-.4-.9-1.3z" />
        <circle cx="10" cy="4.3" r="3.3" />
      </svg>
    </span>
  )
}
