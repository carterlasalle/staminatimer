import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const PRIVACY_POINTS = [
  ['Private account', 'Your sessions are scoped to your account.'],
  ['Row-level protection', 'Session data is protected at the database boundary.'],
  ['No advertising', 'Training data is never an advertising product.'],
  ['Your controls', 'Export and deletion controls stay available to you.'],
]

export function PrivacyScene() {
  return (
    <section id="privacy" className="landing-privacy-section">
      <div className="landing-privacy-sun" aria-hidden />
      <div className="landing-privacy-content">
        <p className="landing-kicker text-landing-sky">Private by design</p>
        <h2 className="mt-5 max-w-xl font-display text-5xl leading-[0.92] tracking-[-0.06em] text-landing-paper sm:text-7xl">
          Your training stays yours.
        </h2>
        <dl className="mt-16 border-y border-landing-mist/15">
          {PRIVACY_POINTS.map(([term, description]) => (
            <div
              key={term}
              className="grid gap-2 border-b border-landing-mist/15 py-5 last:border-0 sm:grid-cols-[minmax(11rem,.55fr)_1fr]"
            >
              <dt className="font-medium text-landing-paper">{term}</dt>
              <dd className="text-sm leading-relaxed text-landing-soft">{description}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-24 flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="text-sm text-landing-sky">A quieter place to begin.</p>
            <h3 className="mt-3 font-display text-4xl tracking-[-0.05em] text-landing-paper sm:text-5xl">
              Ready when you are.
            </h3>
          </div>
          <Link href="/login" className="landing-primary-action">
            Start training <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
