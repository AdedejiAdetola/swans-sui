'use client'

import HarmoniaHeader from '../components/HarmoniaHeader'
import HarmoniaHero from '../components/HarmoniaHero'
import HarmoniaFeatures from '../components/HarmoniaFeatures'
import HarmoniaCTA from '../components/HarmoniaCTA'
import HarmoniaFooter from '../components/HarmoniaFooter'
import HarmoniaBackgroundFX from '../components/HarmoniaBackgroundFX'

export default function HomePage() {
  return (
    <div className="bg-neutral-950 text-neutral-200 antialiased" style={{fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial'}}>
      <HarmoniaBackgroundFX />
      <HarmoniaHeader />
      <HarmoniaHero />
      <HarmoniaFeatures />
      <HarmoniaCTA />
      <HarmoniaFooter />
    </div>
  )
}