import { notFound } from 'next/navigation'
import Rig from './Rig'

// A bench for the puppets: the outfits dressed on the rigged skeleton, posed. Development only.
export default function Lab() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <Rig />
}
