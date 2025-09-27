// Example: Using individual Harmonia components
import { useEffect } from 'react'
import HarmoniaHeader from '../components/HarmoniaHeader'
import HarmoniaHero from '../components/HarmoniaHero'
import HarmoniaFeatures from '../components/HarmoniaFeatures'
import HarmoniaCTA from '../components/HarmoniaCTA'
import HarmoniaFooter from '../components/HarmoniaFooter'
import HarmoniaBackgroundFX from '../components/HarmoniaBackgroundFX'

// Example: Custom page layout with Harmonia components
function CustomHarmoniaPage() {
  useEffect(() => {
    // Initialize any third-party libraries if needed
    if (window.lucide) {
      window.lucide.createIcons()
    }
  }, [])

  return (
    <div className="bg-neutral-950 text-neutral-200 antialiased"
         style={{fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial'}}>

      {/* Background effects */}
      <HarmoniaBackgroundFX />

      {/* Main navigation */}
      <HarmoniaHeader />

      {/* Hero section */}
      <HarmoniaHero />

      {/* Features showcase */}
      <HarmoniaFeatures />

      {/* Add your own custom sections here */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-light text-white text-center mb-8">
            Your Custom Content
          </h2>
          <p className="text-neutral-400 text-center max-w-2xl mx-auto">
            Add your own sections between the Harmonia components
          </p>
        </div>
      </section>

      {/* Call to action */}
      <HarmoniaCTA />

      {/* Footer */}
      <HarmoniaFooter />
    </div>
  )
}

export default CustomHarmoniaPage