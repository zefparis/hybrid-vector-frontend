import styles from './theme.module.css'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Problem } from './components/Problem'
import { Differentiators } from './components/Differentiators'
import { Products } from './components/Products'
import { HowItWorks } from './components/HowItWorks'
import { TrustSignals } from './components/TrustSignals'
import { CTA } from './components/CTA'
import { Footer } from './components/Footer'

export function HVGuardLanding() {
  return (
    <div className={styles.app}>
      <Nav />
      <Hero />
      <Problem />
      <Differentiators />
      <Products />
      <HowItWorks />
      <TrustSignals />
      <CTA />
      <Footer />
    </div>
  )
}
