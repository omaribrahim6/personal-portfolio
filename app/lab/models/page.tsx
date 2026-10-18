import { notFound } from 'next/navigation'
import Models from './Models'

// Every model the site has, side by side, from the front and from the side. Development only.
export default function Lab() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <Models />
}
