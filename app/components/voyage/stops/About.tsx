import type { Role } from '../../../content'
import { walkOrder } from '../itinerary'
import { Beat, Stop, StopHead } from '../Voyage'
import styles from './stops.module.css'

const dates = (role: Role) => role.period?.replace(' (expected)', '').replace(/ · .*/, '') ?? 'undated'

// The garden path: one card for each signpost, in the order he walks past them, oldest first.
export default function About() {
  return (
    <Stop id="about">
      <Beat>
        <StopHead id="about" title="The garden path">
          The story so far, walked: school, work, and the things I volunteer for, a signpost for each, oldest first.
        </StopHead>
        <p className={`label ${styles.legend}`}>
          <span data-category="experience"><i />experience</span>
          <span data-category="volunteer"><i />volunteer</span>
          <span data-category="education"><i />education</span>
        </p>
      </Beat>
      {walkOrder.map((role, i) => (
        <Beat key={role.id} id={`story-${role.id}`}>
          <div className={styles.role} data-category={role.category}>
            <p className={`label ${styles.roleHead}`}><span>Post {i + 1} of {walkOrder.length}</span><span className="stamp">{dates(role)}</span></p>
            <p className={`label ${styles.kind}`}><i />{role.category}{role.period?.includes(' · ') && <> · {role.period.split(' · ')[1]}</>}{role.period?.includes('expected') && <> · expected</>}</p>
            <h3>{role.title}</h3>
            <p className={styles.org}>{role.organization}</p>
            <ul className={styles.details}>
              {role.details.map((item, k) => (
                <li key={k}>{typeof item === 'string' ? item : <>{item.prefix}<a className="vine" href={item.href}>{item.linkText}</a>{item.suffix}</>}</li>
              ))}
            </ul>
          </div>
        </Beat>
      ))}
    </Stop>
  )
}
