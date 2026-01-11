type JsonLdProps = {
  data: Record<string, unknown>
}

/**
 * Safely serialize JSON-LD data, ensuring no malicious content is injected.
 * JSON.stringify escapes special characters, but we add an extra check
 * for script tags that could potentially break out of the JSON context.
 */
function safeJsonLdStringify(data: Record<string, unknown>): string | null {
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  )
}

// Organization Schema
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Stamina Timer",
    url: "https://staminatimer.com",
    logo: "https://staminatimer.com/icon-512.png",
    description: "Science-backed stamina training app for men",
    foundingDate: "2024",
    sameAs: [
      // Add social media links when available
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: "English",
    },
  }

  return <JsonLd data={data} />
}

// Software Application Schema
export function SoftwareApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Stamina Timer",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "1250",
      bestRating: "5",
      worstRating: "1",
    },
    description: "The science-backed training app that helps men build lasting stamina and control. Track your progress, understand your patterns, and see real improvement in weeks.",
    screenshot: "https://staminatimer.com/og-image.png",
    featureList: [
      "Precision Timer with Edge Control",
      "Progress Analytics & Insights",
      "AI-Powered Coaching",
      "Gamified Achievements",
      "Complete Privacy & Security",
    ],
  }

  return <JsonLd data={data} />
}

// FAQ Schema
export function FAQJsonLd() {
  const faqItems = [
    {
      question: "Is this actually backed by science?",
      answer: "Yes. The techniques used in Stamina Timer are based on established methods like the start-stop technique and edging, which have been studied and recommended by sexual health professionals for decades."
    },
    {
      question: "Is my data really private?",
      answer: "Absolutely. Your data is encrypted, stored securely, and never shared with anyone. We don't sell data or show ads. You can delete all your data at any time."
    },
    {
      question: "How long until I see results?",
      answer: "Most users report noticeable improvement within 2-4 weeks of consistent training (3-4 sessions per week). Everyone's different, but the key is consistency."
    },
    {
      question: "Is it really free?",
      answer: "Yes, Stamina Timer is completely free to use with all core features. We may add premium features in the future, but the essential training tools will always be free."
    },
    {
      question: "Can anyone see that I'm using this app?",
      answer: "No. The app doesn't appear in any shared subscriptions or purchase history. On your device, you can rename the app icon if you want extra privacy."
    }
  ]

  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return <JsonLd data={data} />
}

// WebSite Schema with SearchAction
export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Stamina Timer",
    url: "https://staminatimer.com",
    description: "Science-backed stamina training app for men. Build lasting control with data-driven progress tracking.",
    publisher: {
      "@type": "Organization",
      name: "Stamina Timer",
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
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
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
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Build Stamina with Stamina Timer",
    description: "A simple 3-step process to improve your stamina and control using our science-backed training app.",
    totalTime: "PT10M",
    step: [
      {
        "@type": "HowToStep",
        name: "Start a Session",
        text: "Begin your training session with our intuitive timer. The app guides you through edge control exercises.",
        position: 1,
      },
      {
        "@type": "HowToStep",
        name: "Track Your Progress",
        text: "Every session is logged automatically. Watch your stamina improve with detailed analytics and insights.",
        position: 2,
      },
      {
        "@type": "HowToStep",
        name: "See Real Results",
        text: "Most users report noticeable improvement within 2-3 weeks of consistent training. Unlock achievements as you progress.",
        position: 3,
      },
    ],
  }

  return <JsonLd data={data} />
}
