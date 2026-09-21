import type { Json } from '@/lib/supabase/types'

/** Arbitrary JSON-LD payload. `Json` is the repository's canonical JSON value type. */
type JsonLdData = Json

type JsonLdProps = {
  data: JsonLdData
}

/**
 * Safely serialize JSON-LD data, ensuring no malicious content is injected.
 * JSON.stringify escapes special characters, but we add an extra check
 * for script tags that could potentially break out of the JSON context.
 */
function safeJsonLdStringify(data: JsonLdData): string | null {
  try {
    const jsonString = JSON.stringify(data)

    // Safety check: ensure no script tags could break out of the JSON context
    // This is defense-in-depth since JSON.stringify escapes quotes
    if (/<\/script/i.test(jsonString) || /<script/i.test(jsonString)) {
      if (process.env.NODE_ENV === 'development') {
        console.error('JsonLd: Potentially malicious content detected in data')
      }

      return null
    }

    return jsonString
  } catch {
    return null
  }
}

export function JsonLd({ data }: JsonLdProps) {
  const safeJson = safeJsonLdStringify(data)

  // Don't render anything if data is invalid or potentially malicious
  if (!safeJson) {
    return null
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson }} />
}

// Organization Schema
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Stamina Timer',
    url: 'https://staminatimer.com',
    logo: 'https://staminatimer.com/icon-512.png',
    description: 'A private training app for building lasting control',
    foundingDate: '2024',
    sameAs: ['https://github.com/carterlasalle/staminatimer'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'carterlasalle@gmail.com',
      url: 'https://staminatimer.com/contact',
      availableLanguage: 'English',
    },
    // No `address`: the project has no business premises to publish, and a
    // made-up PostalAddress is worse than an absent one.
  }

  return <JsonLd data={data} />
}

// Software Application Schema
export function SoftwareApplicationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Stamina Timer',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    // No aggregateRating: the app has no ratings, and inventing them is both a
    // structured-data violation and a claim this product cannot support.
    description:
      'A private training app for building lasting control. Follow a measured guided program, track your progress, and see how each session compares with your own baseline.',
    screenshot: 'https://staminatimer.com/og-image.png',
    featureList: [
      'Precision Timer with Edge Control',
      'Progress Analytics & Insights',
      'AI-Powered Coaching',
      'Gamified Achievements',
      'Complete Privacy & Security',
    ],
  }

  return <JsonLd data={data} />
}

// FAQ Schema
export function FAQJsonLd() {
  const faqItems = [
    {
      question: 'Is this actually backed by science?',
      answer:
        'Behavioural techniques such as the start-stop method have been described in sexual-health literature. Results vary, and Stamina Timer does not diagnose or treat any condition.',
    },
    {
      question: 'Is my data really private?',
      answer:
        "Absolutely. Your data is encrypted, stored securely, and never shared with anyone. We don't sell data or show ads. You can delete all your data at any time.",
    },
    {
      question: 'How long until I see results?',
      answer:
        "Most users report noticeable improvement within 2-4 weeks of consistent training (3-4 sessions per week). Everyone's different, but the key is consistency.",
    },
    {
      question: 'Is it really free?',
      answer:
        'Yes, Stamina Timer is completely free to use with all core features. We may add premium features in the future, but the essential training tools will always be free.',
    },
    {
      question: "Can anyone see that I'm using this app?",
      answer:
        "No. The app doesn't appear in any shared subscriptions or purchase history. On your device, you can rename the app icon if you want extra privacy.",
    },
  ]

  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return <JsonLd data={data} />
}

// WebSite Schema with SearchAction
export function WebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Stamina Timer',
    url: 'https://staminatimer.com',
    description:
      'Science-backed stamina training app for men. Build lasting control with data-driven progress tracking.',
    publisher: {
      '@type': 'Organization',
      name: 'Stamina Timer',
    },
  }

  return <JsonLd data={data} />
}

// BreadcrumbList Schema
type BreadcrumbItem = {
  name: string
  url: string
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={data} />
}

// HowTo Schema for the training process
export function HowToJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Build Stamina with Stamina Timer',
    description:
      'A simple 3-step process to improve your stamina and control using our science-backed training app.',
    totalTime: 'PT10M',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Start a Session',
        text: 'Begin your training session with our intuitive timer. The app guides you through edge control exercises.',
        position: 1,
      },
      {
        '@type': 'HowToStep',
        name: 'Track Your Progress',
        text: 'Every session is logged automatically. Watch your stamina improve with detailed analytics and insights.',
        position: 2,
      },
      {
        '@type': 'HowToStep',
        name: 'See Real Results',
        text: 'Most users report noticeable improvement within 2-3 weeks of consistent training. Unlock achievements as you progress.',
        position: 3,
      },
    ],
  }

  return <JsonLd data={data} />
}
