// SEO Configuration for staminatimer.com
export const SITE_CONFIG = {
  name: 'Stamina Timer',
  url: 'https://staminatimer.com',
  description: 'Science-backed stamina training app for men. Build lasting control with data-driven progress tracking, AI coaching, and proven techniques.',
  ogImage: '/og-image.png',
  twitterHandle: '@staminatimer',
  locale: 'en_US',
} as const

// Programmatic SEO - Guide Topics
// Full guide definitions with metadata for scalable pSEO
export const GUIDE_TOPICS = [
  {
    slug: 'stamina-training-basics',
    title: 'Stamina Training Basics',
    description: 'Learn the fundamentals of stamina training with science-backed techniques for lasting improvement.',
    keywords: ['stamina training', 'stamina basics', 'how to last longer', 'stamina exercises'],
    category: 'fundamentals',
    priority: 0.9,
    publishedAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
    featured: true,
  },
  {
    slug: 'edging-techniques',
    title: 'Edging Techniques for Beginners',
    description: 'Master the art of edging with step-by-step techniques that help build control and extend duration.',
    keywords: ['edging techniques', 'edging for beginners', 'edge control', 'stamina edging'],
    category: 'techniques',
    priority: 0.8,
    publishedAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-11-15T00:00:00Z',
    featured: true,
  },
  {
    slug: 'kegel-exercises-men',
    title: 'Kegel Exercises for Men',
    description: 'Strengthen your pelvic floor muscles with targeted kegel exercises designed specifically for men.',
    keywords: ['kegel exercises men', 'male kegel', 'pelvic floor exercises', 'PC muscle training'],
    category: 'exercises',
    priority: 0.8,
    publishedAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-11-20T00:00:00Z',
    featured: true,
  },
  {
    slug: 'breathing-techniques-stamina',
    title: 'Breathing Techniques for Better Stamina',
    description: 'Control your arousal and extend your sessions with proven breathing techniques and mindfulness practices.',
    keywords: ['breathing techniques', 'stamina breathing', 'arousal control', 'mindfulness stamina'],
    category: 'techniques',
    priority: 0.7,
    publishedAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-10-30T00:00:00Z',
  },
  {
    slug: 'performance-anxiety-tips',
    title: 'Overcoming Performance Anxiety',
    description: 'Practical strategies to overcome performance anxiety and build lasting confidence in the bedroom.',
    keywords: ['performance anxiety', 'sexual confidence', 'anxiety tips', 'bedroom confidence'],
    category: 'mental',
    priority: 0.7,
    publishedAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-11-01T00:00:00Z',
  },
  {
    slug: 'start-stop-method',
    title: 'The Start-Stop Method Explained',
    description: 'A comprehensive guide to the start-stop technique - one of the most effective methods for building stamina.',
    keywords: ['start stop method', 'start stop technique', 'stamina method', 'lasting longer technique'],
    category: 'techniques',
    priority: 0.8,
    publishedAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-11-10T00:00:00Z',
    featured: true,
  },
  {
    slug: 'tracking-progress-stamina',
    title: 'How to Track Your Stamina Progress',
    description: 'Learn how to effectively track and measure your stamina improvement over time with data-driven methods.',
    keywords: ['track stamina progress', 'stamina improvement', 'progress tracking', 'stamina metrics'],
    category: 'fundamentals',
    priority: 0.7,
    publishedAt: '2024-04-01T00:00:00Z',
    updatedAt: '2024-10-20T00:00:00Z',
  },
  {
    slug: 'daily-stamina-routine',
    title: 'Building a Daily Stamina Routine',
    description: 'Create an effective daily routine that fits your lifestyle and delivers consistent stamina improvements.',
    keywords: ['daily stamina routine', 'stamina workout', 'daily exercises', 'stamina schedule'],
    category: 'routines',
    priority: 0.7,
    publishedAt: '2024-04-15T00:00:00Z',
    updatedAt: '2024-11-05T00:00:00Z',
  },
] as const

// FAQ Data for programmatic SEO
export const FAQ_DATA = [
  {
    question: 'How long does it take to see results from stamina training?',
    answer: 'Most users report noticeable improvement within 2-4 weeks of consistent training (3-4 sessions per week). The key is consistency - regular practice leads to lasting improvement. Our data shows an average 40% improvement in duration after 30 days of training.',
  },
  {
    question: 'Is stamina training scientifically proven?',
    answer: 'Yes. The techniques used in stamina training, including the start-stop method and edging, have been studied and recommended by sexual health professionals for decades. These methods work by training your body to recognize and control arousal levels.',
  },
  {
    question: 'What is the best time of day to practice stamina training?',
    answer: 'The best time is when you can practice consistently without interruption. Many users prefer morning sessions when energy levels are high, while others find evening sessions help them unwind. Consistency matters more than timing.',
  },
  {
    question: 'How often should I practice stamina training?',
    answer: 'For optimal results, we recommend 3-4 sessions per week, with each session lasting 10-20 minutes. Allow at least one day of rest between sessions to prevent fatigue. Quality of practice matters more than quantity.',
  },
  {
    question: 'Can kegel exercises really improve stamina?',
    answer: 'Absolutely. Kegel exercises strengthen the pelvic floor muscles, which play a crucial role in controlling arousal and timing. Studies show that men who regularly practice kegel exercises experience significant improvements in control.',
  },
  {
    question: 'Is the Stamina Timer app completely private?',
    answer: 'Yes, privacy is our top priority. All data is encrypted, stored securely, and never shared with anyone. We don\'t sell data or show ads. You can delete all your data at any time from the settings page.',
  },
  {
    question: 'What makes AI coaching different from regular tips?',
    answer: 'Our AI coach analyzes your training patterns, session data, and progress to provide personalized recommendations. Unlike generic tips, AI coaching adapts to your specific needs and identifies areas for improvement based on your actual performance.',
  },
  {
    question: 'Is Stamina Timer really free?',
    answer: 'Yes, Stamina Timer is completely free to use with all core features including the timer, analytics, AI coaching, and achievements. We believe everyone deserves access to effective stamina training tools.',
  },
] as const

// Category metadata for guide pages
export const GUIDE_CATEGORIES = {
  fundamentals: {
    title: 'Fundamentals',
    description: 'Core concepts and basics of stamina training',
  },
  techniques: {
    title: 'Techniques',
    description: 'Proven methods and techniques for building stamina',
  },
  exercises: {
    title: 'Exercises',
    description: 'Physical exercises to improve stamina and control',
  },
  mental: {
    title: 'Mental Training',
    description: 'Mindset and psychological strategies for better performance',
  },
  routines: {
    title: 'Routines',
    description: 'Daily and weekly routines for consistent improvement',
  },
} as const

// Generate metadata helper
export function generatePageMetadata({
  title,
  description,
  path,
  keywords = [],
  ogImage,
}: {
  title: string
  description: string
  path: string
  keywords?: string[]
  ogImage?: string
}) {
  const url = `${SITE_CONFIG.url}${path}`
  const image = ogImage || SITE_CONFIG.ogImage

  return {
    title,
    description,
    keywords: [...keywords, 'stamina timer', 'stamina training', 'last longer'],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      type: 'website',
      images: [
        {
          url: `${SITE_CONFIG.url}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}${image}`],
      creator: SITE_CONFIG.twitterHandle,
    },
  }
}

// Internal linking helpers
export const INTERNAL_LINKS = {
  home: { href: '/', label: 'Home' },
  login: { href: '/login', label: 'Get Started' },
  guides: { href: '/guides', label: 'Training Guides' },
  faq: { href: '/faq', label: 'FAQ' },
  privacy: { href: '/privacy', label: 'Privacy Policy' },
  terms: { href: '/terms', label: 'Terms of Service' },
} as const
