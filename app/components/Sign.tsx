/**
 * A title in Heliotrope, lit like a sign: the solid letters, and the hairline cut laid exactly over them in a
 * second colour (set with --line). The hairline copy is hidden from assistive technology, so the words are read once.
 */
export default function Sign({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`sign ${className}`}>
      {text}
      <span data-line aria-hidden="true">{text}</span>
    </span>
  )
}
