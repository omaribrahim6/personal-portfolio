import type { ReactNode } from 'react'
import { chapters } from '../content'
import Sign from './Sign'
import styles from './Opener.module.css'

/**
 * The head of a section, the way a magazine opens one: the folio line (section, leader, page), the title in
 * stencil capitals across the measure, and the standfirst under it.
 */
export default function Opener({ chapter, title, titleId, children, aside }: {
  chapter: (typeof chapters)[number]['id']
  title: string
  titleId: string
  children?: ReactNode
  aside?: ReactNode
}) {
  const { numeral, section, page } = chapters.find(each => each.id === chapter)!
  return (
    <header className={styles.opener}>
      <p className={`label ${styles.folio}`}>
        <span><b>§ {numeral}</b> {section}</span><i /><span>p. {String(page).padStart(2, '0')}</span>
      </p>
      <div className={styles.head}>
        <h2 id={titleId} className={styles.title}><Sign text={title} /></h2>
        {aside && <div className={styles.aside}>{aside}</div>}
      </div>
      {children && <p className={styles.dek}>{children}</p>}
    </header>
  )
}
