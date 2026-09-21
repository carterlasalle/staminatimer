import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { generatePageMetadata } from '@/lib/seo/config'

export const metadata: Metadata = generatePageMetadata({
  title: 'About Stamina Timer',
  description:
    'What Stamina Timer is, who it is for, how the guided programme works, and what it deliberately does not do.',
  path: '/about',
  keywords: ['about stamina timer', 'stamina training app', 'how stamina timer works'],
})

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link href="/">
        <Button variant="ghost" className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            About Stamina Timer
          </h1>
          <p className="text-sm text-muted-foreground">A private training app for lasting longer</p>
        </CardHeader>
        <CardContent className="content-prose">
          <h2>What this is</h2>
          <p>
            Stamina Timer is a browser-based training app for men who want more control over how
            long a session lasts. It is built around a structured programme rather than a single
            technique, and around measurement rather than feel: you train a continuous block, you
            record what happened, and the target only moves when the result repeats across separate
            sessions.
          </p>

          <h2>Who it is for</h2>
          <p>
            It is for people who are willing to practise consistently, and who want to know whether
            the practice is working. It suits someone who has already tried to slow down or distract
            themselves and found that the result varies too much to trust. It assumes you can
            practise in private and that you are an adult.
          </p>

          <h2>How the programme works</h2>
          <p>
            A week has five kinds of session, each with one job. Control builds stamina by spending
            most of the time at moderate arousal. Endurance tests it once, in a single unbroken
            attempt with no second chance that day. Baseline measures it the same way every time, so
            results are comparable. Reset is breathing and relaxation, not training. Easy is
            optional and unscored.
          </p>
          <p>
            Progress is deliberate rather than calendar-driven. A target from 2:00 up to 10:00
            advances only after several separate observations pass it, at least one of which comes
            from an Endurance or Baseline session, so a single good day does not move you forward
            and a missed day does not set you back.
          </p>

          <h2>What it does not do</h2>
          <ul>
            <li>
              It does not diagnose or treat any medical condition. It is not a medical device.
            </li>
            <li>
              It does not give medication, supplement or dosage advice, and it does not suggest
              changing a prescription.
            </li>
            <li>
              It does not promise a timeline. Progress depends on the person and the practice.
            </li>
            <li>It does not sell or promote anything beyond the app itself.</li>
          </ul>
          <p>
            If you have pain, a change in sensation, or a concern about your health, a clinician is
            the right person to assess it. The <Link href="/guides">guides</Link> describe patterns
            and techniques, not conditions.
          </p>

          <h2>Privacy</h2>
          <p>
            Training records belong to your account and are protected per-user. There are no ads and
            your data is not sold. You can delete your data at any time from the app. The{' '}
            <Link href="/privacy">privacy policy</Link> sets out exactly what is stored.
          </p>

          <h2>How it is built</h2>
          <p>
            Stamina Timer is an independent project, published as open source under the MIT licence.
            The source is available on GitHub:
          </p>
          <a
            href="https://github.com/carterlasalle/staminatimer"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            github.com/carterlasalle/staminatimer
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>

          <h2>Where to go next</h2>
          <ul>
            <li>
              <Link href="/guides">Guides</Link> — the training library
            </li>
            <li>
              <Link href="/faq">FAQ</Link> — pricing, privacy and common questions
            </li>
            <li>
              <Link href="/contact">Contact</Link> — how to reach the project
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
