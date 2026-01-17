import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GUIDE_TOPICS, SITE_CONFIG, generatePageMetadata } from '@/lib/seo/config'
import { BreadcrumbJsonLd, JsonLd } from '@/components/seo/JsonLd'
import { Timer, ArrowLeft, ArrowRight, Clock, CheckCircle } from 'lucide-react'

type PageProps = {
  params: Promise<{ slug: string }>
}

// Generate static params for all guides
export function generateStaticParams() {
  return GUIDE_TOPICS.map((guide) => ({
    slug: guide.slug,
  }))
}

// Generate metadata for each guide
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = GUIDE_TOPICS.find((g) => g.slug === slug)
  if (!guide) return {}

  return generatePageMetadata({
    title: `${guide.title} | Stamina Timer Guides`,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    keywords: guide.keywords as unknown as string[],
  })
}

// Guide content data - in production, this could come from a CMS
const GUIDE_CONTENT: Record<string, { sections: { title: string; content: string }[]; tips: string[]; readTime: string }> = {
  'stamina-training-basics': {
    readTime: '8 min read',
    sections: [
      {
        title: 'What is Stamina Training?',
        content: 'Stamina training is a systematic approach to improving sexual endurance and control. It involves a combination of physical exercises, mental techniques, and consistent practice to help you last longer and feel more confident. Unlike quick fixes or pills, stamina training addresses the root causes of premature finishing and builds lasting improvement through neurological and muscular conditioning.',
      },
      {
        title: 'The Science Behind It',
        content: 'Your body\'s arousal response is controlled by the autonomic nervous system. Through regular training, you can develop better awareness of your arousal levels and learn to control the point of no return. This involves training your pelvic floor muscles, developing mental focus techniques, and creating new neural pathways that give you more control over your physical responses.',
      },
      {
        title: 'Getting Started',
        content: 'Begin with short, focused sessions of 10-15 minutes. The key is consistency rather than duration. Start by simply becoming more aware of your arousal levels on a scale of 1-10. Practice identifying when you reach different levels and learn to back off before reaching the point of no return. This awareness is the foundation of all stamina training.',
      },
      {
        title: 'Building a Routine',
        content: 'For best results, train 3-4 times per week with at least one rest day between sessions. Track your progress using metrics like total session time, number of edges (approaching but not reaching climax), and overall control rating. Over time, you\'ll see clear patterns and improvement in your data.',
      },
    ],
    tips: [
      'Start with shorter sessions and gradually increase duration',
      'Focus on awareness before trying to extend time',
      'Track every session to see your improvement',
      'Be patient - real results take 2-4 weeks of consistent practice',
      'Use breathing techniques to help control arousal',
    ],
  },
  'edging-techniques': {
    readTime: '10 min read',
    sections: [
      {
        title: 'Understanding Edging',
        content: 'Edging is the practice of approaching the point of climax and then deliberately backing off before reaching it. This technique, also known as the "stop-start method," is one of the most effective ways to build stamina and control. By repeatedly approaching and retreating from the edge, you train your body to tolerate higher levels of arousal without finishing.',
      },
      {
        title: 'The Edge Zone',
        content: 'Think of arousal as a scale from 1 to 10, where 10 is the point of no return. The "edge zone" is typically between 7-9 on this scale. Your goal during edging practice is to reach this zone and maintain it without crossing over. With practice, you\'ll be able to stay in the edge zone longer and develop a better sense of exactly where your point of no return is.',
      },
      {
        title: 'Basic Technique',
        content: 'Start stimulation normally until you reach about a 7 on the arousal scale. At this point, stop all stimulation and focus on deep, slow breathing. Wait until you drop back to about a 4-5 before resuming. Repeat this cycle multiple times during each session. As you improve, try to get closer to 8-9 before stopping.',
      },
      {
        title: 'Advanced Variations',
        content: 'Once you\'ve mastered the basic stop-start, try the squeeze technique: when you reach the edge, apply gentle pressure to the base or tip to help reduce arousal faster. Another advanced method is to maintain light stimulation at the edge instead of stopping completely, which builds even greater control.',
      },
    ],
    tips: [
      'Always start with a warm-up period of lighter stimulation',
      'Use the 1-10 arousal scale to track your levels',
      'Aim for 3-5 edges per session to start',
      'Deep breathing is crucial when backing off from the edge',
      'Keep sessions to 15-20 minutes to maintain focus',
    ],
  },
  'kegel-exercises-men': {
    readTime: '7 min read',
    sections: [
      {
        title: 'What Are Kegels for Men?',
        content: 'Kegel exercises target the pelvic floor muscles, specifically the pubococcygeus (PC) muscle. This muscle group controls urine flow and plays a crucial role in sexual function. By strengthening these muscles, you gain better control over ejaculation timing and can experience stronger sensations. Kegels are one of the most research-backed methods for improving male sexual stamina.',
      },
      {
        title: 'Finding Your PC Muscle',
        content: 'The easiest way to locate your PC muscle is to stop your urine stream midflow. The muscle you squeeze to do this is your PC muscle. You can also find it by trying to lift your testicles without using your hands. Once you\'ve identified the muscle, you can exercise it anywhere, anytime, without anyone knowing.',
      },
      {
        title: 'Basic Kegel Routine',
        content: 'Start with quick contractions: squeeze your PC muscle for 1-2 seconds, then release. Do 10-15 repetitions. Next, do slow contractions: squeeze and hold for 5 seconds, then release for 5 seconds. Do 10 repetitions. Aim to complete this routine 3 times daily. As you get stronger, increase hold times to 10 seconds.',
      },
      {
        title: 'Advanced Techniques',
        content: 'Once basic kegels feel easy, try reverse kegels - consciously relaxing and pushing out the PC muscle. This is important for control during high arousal. You can also practice "flutter" kegels - rapid contractions as fast as possible for 10-15 seconds. Combining both contraction and relaxation training gives you the most complete control.',
      },
    ],
    tips: [
      'Practice kegels during everyday activities like driving or working',
      'Don\'t hold your breath while doing kegels',
      'Start with the basic routine for 2 weeks before advancing',
      'Results typically appear after 4-6 weeks of consistent practice',
      'Don\'t overdo it - muscle fatigue can temporarily worsen control',
    ],
  },
  'breathing-techniques-stamina': {
    readTime: '6 min read',
    sections: [
      {
        title: 'Why Breathing Matters',
        content: 'Your breathing directly affects your nervous system and arousal levels. Fast, shallow breathing activates the sympathetic (fight-or-flight) system, which accelerates arousal. Deep, slow breathing activates the parasympathetic system, which calms the body and helps you maintain control. Mastering breath control is one of the fastest ways to improve stamina.',
      },
      {
        title: 'Diaphragmatic Breathing',
        content: 'Also called belly breathing, this technique involves breathing deeply into your belly rather than your chest. Place one hand on your chest and one on your belly. When you breathe in, your belly should rise while your chest stays relatively still. Practice this for 5 minutes daily until it becomes automatic.',
      },
      {
        title: 'The 4-7-8 Technique',
        content: 'This powerful calming technique involves inhaling for 4 seconds, holding for 7 seconds, and exhaling for 8 seconds. Use this when you feel yourself approaching the edge too quickly. The extended exhale activates the parasympathetic nervous system and helps reduce arousal naturally.',
      },
      {
        title: 'Integrating Breathing with Training',
        content: 'During stamina training sessions, focus on maintaining slow, rhythmic breathing. When you feel arousal building too fast, immediately switch to the 4-7-8 technique. Over time, you\'ll develop the ability to use breathing as a "brake pedal" to control your arousal level in any situation.',
      },
    ],
    tips: [
      'Practice breathing techniques outside of training sessions first',
      'Never hold your breath during intimate moments',
      'Exhales should be longer than inhales for calming effect',
      'Combine breathing with mental focus for best results',
      'Make slow breathing your default, not just emergency response',
    ],
  },
  'performance-anxiety-tips': {
    readTime: '9 min read',
    sections: [
      {
        title: 'Understanding Performance Anxiety',
        content: 'Performance anxiety is a self-fulfilling cycle where worry about performing well actually makes performance worse. The stress hormones released when you\'re anxious accelerate arousal and reduce your ability to control it. Breaking this cycle requires addressing both the physical symptoms and the underlying thought patterns.',
      },
      {
        title: 'Reframe Your Mindset',
        content: 'The goal isn\'t to "last as long as possible" - it\'s to be present and connected with your partner. Shifting focus from performance to pleasure removes the pressure that causes anxiety. Remember that intimacy is about mutual enjoyment, not achieving a specific duration. Your partner wants you to be present, not stressed.',
      },
      {
        title: 'Practical Strategies',
        content: 'Before intimate moments, practice 5 minutes of deep breathing to calm your nervous system. During intimacy, stay focused on physical sensations rather than monitoring your performance. If anxiety spikes, slow down and use the 4-7-8 breathing technique. Communication with your partner also helps - telling them you want to slow down reduces pressure.',
      },
      {
        title: 'Building Confidence Through Training',
        content: 'Regular stamina training builds confidence by giving you actual skills and proven track record of improvement. When you\'ve practiced control techniques dozens of times, you trust your ability to use them when it matters. The data from your training sessions provides concrete evidence of your improvement, replacing anxiety with confidence.',
      },
    ],
    tips: [
      'Practice relaxation techniques daily, not just before intimacy',
      'Communicate openly with your partner about taking things slow',
      'Focus on pleasure and connection, not performance metrics',
      'Build a track record through solo training to prove your abilities to yourself',
      'Consider that some anxiety is normal and doesn\'t mean something is wrong',
    ],
  },
  'start-stop-method': {
    readTime: '8 min read',
    sections: [
      {
        title: 'What is the Start-Stop Method?',
        content: 'The start-stop method, developed by urologist James Semans in the 1950s, is one of the most clinically proven techniques for improving stamina. The concept is simple: stimulate until you approach climax, stop completely until arousal subsides, then resume. This trains your body to tolerate higher arousal levels without finishing.',
      },
      {
        title: 'Step-by-Step Guide',
        content: 'Begin stimulation and pay close attention to your arousal level using a 1-10 scale. When you reach 7-8 (about 2 steps below the point of no return), stop all stimulation. Keep your body relaxed and breathe deeply. Wait until your arousal drops to about 4-5 before resuming. Repeat this cycle 3-5 times per session.',
      },
      {
        title: 'Common Mistakes to Avoid',
        content: 'The biggest mistake is waiting too long to stop - if you\'re already at 9 or above, it may be too late. Start conservative and stop earlier than you think you need to. Another mistake is tensing up when you stop; keep your body relaxed, especially your pelvic floor and leg muscles. Finally, don\'t rush - give yourself full time to come back down before restarting.',
      },
      {
        title: 'Progressing Over Time',
        content: 'As you improve, challenge yourself by stopping at higher arousal levels (8, then 9). You can also try reducing the rest time between stops. Track your sessions to see progress: measure total time, number of successful stops, and rate your control on a 1-10 scale. Most users see significant improvement within 3-4 weeks of consistent practice.',
      },
    ],
    tips: [
      'Use a timer to track your total session time',
      'Aim to complete at least 3 full start-stop cycles per session',
      'Practice identifying your arousal level - it becomes easier with experience',
      'Don\'t be discouraged if you go over the edge sometimes - it\'s part of learning',
      'Combine with breathing techniques for even better results',
    ],
  },
  'tracking-progress-stamina': {
    readTime: '5 min read',
    sections: [
      {
        title: 'Why Track Your Progress?',
        content: 'Tracking transforms vague efforts into measurable improvement. When you log each session, you create data that shows exactly how you\'re progressing. This provides motivation on difficult days, helps identify what techniques work best for you, and gives you confidence based on proven results rather than guesswork.',
      },
      {
        title: 'Key Metrics to Track',
        content: 'The most important metrics are: total session duration, time spent at edge (high arousal without finishing), number of edges or stop-starts per session, and a subjective control rating (1-10). Advanced metrics include average time between edges, recovery time after stopping, and whether you finished during an edge or active period.',
      },
      {
        title: 'Using the Stamina Timer App',
        content: 'Stamina Timer automatically tracks all key metrics for you. Simply start a session, tap to log when you begin edging, and tap again when you step back. The app calculates your statistics, shows trends over time, and provides insights about your best performing days and techniques. AI coaching uses your data to give personalized recommendations.',
      },
      {
        title: 'Analyzing Your Data',
        content: 'Review your data weekly to spot patterns. Are you performing better at certain times of day? After certain amounts of rest? When you use specific techniques? Look for your average improvement rate and set realistic goals based on your personal trend line. Most users improve by 30-50% in total time within their first month.',
      },
    ],
    tips: [
      'Log every session, even short or unsuccessful ones',
      'Review your weekly trends, not just individual sessions',
      'Set specific, measurable goals based on your baseline data',
      'Use the insights to adjust your training schedule and techniques',
      'Celebrate milestones to stay motivated',
    ],
  },
  'daily-stamina-routine': {
    readTime: '7 min read',
    sections: [
      {
        title: 'Building Sustainable Habits',
        content: 'The key to lasting improvement is consistency, not intensity. A short daily routine you actually do beats a long routine you skip. The goal is to make stamina training a natural part of your day, like brushing your teeth. Start small and build gradually - this approach leads to permanent results.',
      },
      {
        title: 'Morning Routine (5 minutes)',
        content: 'Start your day with kegel exercises: do 20 quick squeezes followed by 10 slow holds (5 seconds each). This takes about 3 minutes. Then spend 2 minutes doing diaphragmatic breathing while visualizing your arousal scale. This primes your body and mind for control throughout the day.',
      },
      {
        title: 'Training Sessions (15-20 minutes, 3-4x/week)',
        content: 'Schedule dedicated training sessions on alternating days. Use the full start-stop method with careful tracking. Aim for at least 3-5 complete cycles per session. End each session by noting your metrics in the app and reflecting on what worked well. Keep sessions to 20 minutes maximum to maintain focus.',
      },
      {
        title: 'Evening Wind-Down (3 minutes)',
        content: 'Before bed, do a brief kegel routine (10 quick squeezes, 5 long holds) and practice the 4-7-8 breathing technique for relaxation. This reinforces the mind-body connection and helps recovery between training sessions. It also improves sleep quality, which supports overall sexual health.',
      },
    ],
    tips: [
      'Link new habits to existing ones (kegels during morning coffee)',
      'Use app reminders to stay consistent',
      'Start with just the morning routine for week one',
      'Add training sessions in week two once morning routine is habitual',
      'Track streak of consecutive days to build momentum',
    ],
  },
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params
  const guide = GUIDE_TOPICS.find((g) => g.slug === slug)
  const content = GUIDE_CONTENT[slug]

  if (!guide || !content) {
    notFound()
  }

  // Find related guides (same category, excluding current)
  const relatedGuides = GUIDE_TOPICS.filter(
    (g) => g.category === guide.category && g.slug !== guide.slug
  ).slice(0, 2)

  // Article structured data
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    author: {
      '@type': 'Organization',
      name: 'Stamina Timer',
      url: SITE_CONFIG.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Stamina Timer',
      url: SITE_CONFIG.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/icons/icon-512x512.png`,
      },
    },
    mainEntityOfPage: `${SITE_CONFIG.url}/guides/${guide.slug}`,
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString(),
  }

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_CONFIG.url },
          { name: 'Guides', url: `${SITE_CONFIG.url}/guides` },
          { name: guide.title, url: `${SITE_CONFIG.url}/guides/${guide.slug}` },
        ]}
      />
      <JsonLd data={articleJsonLd} />

      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <Timer className="w-5 h-5" />
            <span className="font-semibold">Stamina Timer</span>
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/guides" className="hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              All Guides
            </Link>
            <span>/</span>
            <span className="capitalize">{guide.category}</span>
          </nav>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {guide.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {content.readTime}
            </span>
            <span className="capitalize px-2 py-0.5 bg-primary/10 text-primary rounded">
              {guide.category}
            </span>
          </div>

          {/* Intro */}
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
            {guide.description}
          </p>

          {/* Content Sections */}
          <div className="space-y-12">
            {content.sections.map((section, i) => (
              <section key={i}>
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                <p className="text-foreground/90 leading-relaxed">{section.content}</p>
              </section>
            ))}
          </div>

          {/* Tips Box */}
          <div className="mt-12 p-6 rounded-xl bg-primary/5 border border-primary/20">
            <h3 className="text-lg font-semibold mb-4">Key Takeaways</h3>
            <ul className="space-y-3">
              {content.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-12 p-8 rounded-xl bg-card border border-border text-center">
            <h3 className="text-xl font-bold mb-2">Put This Into Practice</h3>
            <p className="text-muted-foreground mb-6">
              Track your progress and get personalized insights with our free stamina training app.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Start Training Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Related Guides */}
          {relatedGuides.length > 0 && (
            <div className="mt-16">
              <h3 className="text-xl font-bold mb-6">Related Guides</h3>
              <div className="grid gap-4">
                {relatedGuides.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/guides/${related.slug}`}
                    className="group block p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <h4 className="font-semibold group-hover:text-primary transition-colors">
                      {related.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {related.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              <span className="font-semibold">Stamina Timer</span>
            </Link>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link href="/guides" className="hover:text-foreground transition-colors">Guides</Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Stamina Timer
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
