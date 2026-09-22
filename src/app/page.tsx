import { CinematicHero } from '@/components/landing/CinematicHero'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingNav } from '@/components/landing/LandingNav'
import { PrivacyScene } from '@/components/landing/PrivacyScene'
import { ProductStory } from '@/components/landing/ProductStory'
import { ProgressLandscape } from '@/components/landing/ProgressLandscape'

export default function Home() {
  return (
    <div className="landing-page min-h-screen overflow-x-clip bg-[#071521] text-[#edf3f1]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-[#edf3f1] focus:px-4 focus:py-2 focus:text-[#071521]"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main">
        <CinematicHero />
        <ProductStory />
        <ProgressLandscape />
        <PrivacyScene />
      </main>
      <LandingFooter />
    </div>
  )
}
