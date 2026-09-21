import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { generatePageMetadata } from '@/lib/seo/config'

export const metadata: Metadata = generatePageMetadata({
  title: 'Contact Stamina Timer',
  description:
    'How to reach the Stamina Timer project for bugs, privacy requests and licensing questions, and what to do with a health question instead.',
  path: '/contact',
  keywords: ['contact stamina timer', 'stamina timer support', 'stamina timer privacy request'],
})

export default function ContactPage() {
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
          <h1 className="font-display text-2xl font-semibold tracking-tight">Contact</h1>
          <p className="text-sm text-muted-foreground">
            Stamina Timer is a small independent project
          </p>
        </CardHeader>
        <CardContent className="content-prose">
          <h2>Email</h2>
          <p>
            Write to{' '}
            <a
              href="mailto:carterlasalle@gmail.com"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              carterlasalle@gmail.com
            </a>{' '}
            for anything that needs a reply in private, including:
          </p>
          <ul>
            <li>
              <strong>Privacy and data requests</strong> — access, correction or deletion of the
              data held against your account.
            </li>
            <li>
              <strong>Security reports</strong> — please describe the issue rather than exploiting
              it, and allow time for a fix.
            </li>
            <li>
              <strong>Licensing</strong> — questions about the MIT licence or reuse of the source.
            </li>
          </ul>

          <h2>Bugs and feature requests</h2>
          <p>
            For anything about how the app behaves, the public issue tracker is the fastest route
            and keeps the discussion searchable for other people:
          </p>
          <a
            href="https://github.com/carterlasalle/staminatimer/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            github.com/carterlasalle/staminatimer/issues
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>

          <h2>What this address is not for</h2>
          <p>
            Stamina Timer does not provide medical advice, and emailing the project does not create
            a clinical relationship. Questions about symptoms, pain, a change in sensation,
            medication or a suspected condition belong with a clinician, who can examine you and
            take a history. The same applies to anything about fertility or mental health.
          </p>
          <p>
            Nobody here can tell you what is causing a symptom, and none of the{' '}
            <Link href="/guides">guides</Link> are written to do that either.
          </p>

          <h2>Response times</h2>
          <p>
            There is no support team behind this address, and no guaranteed response time. Reports
            that include the page you were on, what you expected, and what happened instead are much
            easier to act on.
          </p>

          <h2>Before you write</h2>
          <p>
            The <Link href="/faq">FAQ</Link> covers pricing, what is stored, and how to delete your
            data. The <Link href="/privacy">privacy policy</Link> is the authoritative description
            of what the app keeps.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
