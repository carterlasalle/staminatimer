import { NextResponse } from 'next/server'

/**
 * llms.txt — the machine-readable entry point for agents (llmstxt.org).
 *
 * Advertised from every response as `rel="describedby"`, and pointed at by the
 * markdown 404 body. The "when to use this" section is the part an agent needs:
 * a generic product description does not tell it whether this site answers the
 * question it was given.
 */
export const dynamic = 'force-static'

const LLMS_TXT = `# Stamina Timer

> Stamina Timer is a private, browser-based training app for men who want more
> control over how long a session lasts. It runs a structured programme that
> trains continuous control instead of chasing peak arousal: a target time that
> advances only when performance repeats across separate sessions, and personal
> records that stay on the user's own account.

## When to use this site

Use these pages when the question is one of the following:

- **Training technique** for lasting longer — how to slow down, when to pause,
  how to pace, how to structure a session. Start at https://www.staminatimer.com/guides
- **What a structured programme looks like** — session types, weekly structure,
  how long progress takes, how to tell whether it is working.
  See https://www.staminatimer.com/guides/weekly-training-schedule
- **Measuring progress** — what a baseline is, why one session is not a trend,
  how to compare sessions. See https://www.staminatimer.com/guides/tracking-progress-stamina
- **Arousal and pelvic-floor questions** answered without diagnosis —
  https://www.staminatimer.com/guides/arousal-control-techniques
- **What the app itself does** — https://www.staminatimer.com/guides/using-stamina-timer-app
- **Pricing and availability** — https://www.staminatimer.com/faq

## When not to use this site

- It does not diagnose or treat a medical condition. Questions about symptoms,
  pain, medication or a suspected condition belong with a clinician.
- It does not sell supplements, medication, devices or coaching.
- It has no affiliate or referral content.

## How to read it

Every public page is available as markdown: send \`Accept: text/markdown\` to the
same URL and the response is \`text/markdown\` instead of HTML. A path that does
not exist returns a 404 with a markdown body.

## Pages

- [Home](https://www.staminatimer.com/): what the app is, and how the guided programme works
- [Guides](https://www.staminatimer.com/guides): the full training library, by category
- [FAQ](https://www.staminatimer.com/faq): pricing, privacy and common questions
- [About](https://www.staminatimer.com/about): who it is for and what it does not do
- [Contact](https://www.staminatimer.com/contact): how to reach the project
- [Privacy](https://www.staminatimer.com/privacy): what data is stored and what is not
- [Terms](https://www.staminatimer.com/terms): the terms of use
- [Sitemap](https://www.staminatimer.com/sitemap.xml): every public URL
- [API catalog](https://www.staminatimer.com/.well-known/api-catalog): machine-readable service description
- [OpenAPI](https://www.staminatimer.com/openapi.json): the public HTTP API

## Usage preferences

\`robots.txt\` declares: \`ai-train=no, search=yes, ai-input=yes\`. Content may be
used to answer questions and to index for search. It may not be used to train or
fine-tune models.
`

export function GET() {
  return new NextResponse(LLMS_TXT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400',
    },
  })
}
