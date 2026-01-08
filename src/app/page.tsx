'use client'

export const dynamic = 'force-dynamic'

import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import {
  Timer as TimerIcon,
  TrendingUp,
  Shield,
  Target,
  BarChart3,
  Trophy,
  Clock,
  CheckCircle2,
  Star,
  ArrowRight,
  Play,
  Brain,
  Flame,
  Lock
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    async function checkSession(): Promise<void> {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkSession()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <TimerIcon className="h-8 w-8 text-primary shrink-0" />
              <span className="ml-2 text-xl font-bold">Stamina Timer</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                How It Works
              </a>
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Features
              </a>
              <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Reviews
              </a>
              <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                FAQ
              </a>
            </div>

            <div className="flex items-center gap-3">
              <ModeToggle />
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:inline-flex">Log In</Button>
              </Link>
              <Link href="/login">
                <Button>Start Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Shield className="h-4 w-4" />
              100% Private & Secure
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Last Longer.{' '}
              <span className="text-primary">Feel Confident.</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The science-backed training app that helps you build lasting stamina and control.
              Track your progress, understand your patterns, and see real improvement in weeks.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8 h-14 gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  Start Training Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 gap-2">
                  <Play className="h-5 w-5" />
                  See How It Works
                </Button>
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-primary border-2 border-background" />
                  ))}
                </div>
                <span><strong className="text-foreground">10,000+</strong> men training</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <span><strong className="text-foreground">4.9/5</strong> average rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              You&apos;re Not Alone. This Is More Common Than You Think.
            </h2>
            <p className="text-lg text-muted-foreground">
              Studies show that 30-40% of men experience premature concerns at some point.
              The good news? It&apos;s trainable—just like building any other skill.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4 text-destructive">Without Training</h3>
                <ul className="space-y-3">
                  {[
                    'Unpredictable performance anxiety',
                    'No way to track what works',
                    'Frustration and embarrassment',
                    'Guessing at solutions that don\'t help'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <span className="text-destructive mt-1">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4 text-primary">With Stamina Timer</h3>
                <ul className="space-y-3">
                  {[
                    'Data-driven training that works',
                    'See measurable progress weekly',
                    'Build lasting confidence',
                    'Understand your body\'s patterns'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple. Private. Effective.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start seeing results in just 3 easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                icon: <Play className="h-8 w-8" />,
                title: 'Start a Session',
                description: 'Begin your training session with our intuitive timer. The app guides you through edge control exercises.'
              },
              {
                step: '2',
                icon: <BarChart3 className="h-8 w-8" />,
                title: 'Track Your Progress',
                description: 'Every session is logged automatically. Watch your stamina improve with detailed analytics and insights.'
              },
              {
                step: '3',
                icon: <Trophy className="h-8 w-8" />,
                title: 'See Real Results',
                description: 'Most users report noticeable improvement within 2-3 weeks of consistent training. Unlock achievements as you progress.'
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 text-primary mb-6">
                    {item.icon}
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by experts, designed for real results
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: <Clock className="h-6 w-6" />,
                title: 'Precision Timer',
                description: 'Track active time, edge duration, and rest periods with millisecond accuracy.'
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                title: 'Progress Analytics',
                description: 'Visualize your improvement over time with charts, trends, and performance insights.'
              },
              {
                icon: <Target className="h-6 w-6" />,
                title: 'Smart Goals',
                description: 'Set personalized targets and get notified when you hit new milestones.'
              },
              {
                icon: <Brain className="h-6 w-6" />,
                title: 'AI Coach',
                description: 'Get personalized tips and recommendations based on your training patterns.'
              },
              {
                icon: <Trophy className="h-6 w-6" />,
                title: 'Achievements',
                description: 'Stay motivated with gamified progress tracking and unlockable badges.'
              },
              {
                icon: <Lock className="h-6 w-6" />,
                title: 'Complete Privacy',
                description: 'Your data is encrypted and never shared. Only you can see your progress.'
              }
            ].map((feature, i) => (
              <Card key={i} className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Real Results from Real Users
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands who&apos;ve transformed their confidence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                quote: "After just 3 weeks, I noticed a real difference. The data tracking helped me understand what actually works for my body.",
                author: "Michael T.",
                detail: "Improved 40% in 4 weeks",
                rating: 5
              },
              {
                quote: "Finally, a scientific approach that isn't embarrassing to use. The privacy features gave me peace of mind to actually commit to it.",
                author: "James R.",
                detail: "Using for 2 months",
                rating: 5
              },
              {
                quote: "The AI coach suggestions were surprisingly helpful. It's like having a personal trainer for something you can't exactly talk about openly.",
                author: "David K.",
                detail: "Hit 15-minute milestone",
                rating: 5
              }
            ].map((testimonial, i) => (
              <Card key={i} className="bg-card">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <blockquote className="text-foreground mb-4">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-primary" />
                    <div>
                      <div className="font-medium">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.detail}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Active Users' },
              { value: '500,000+', label: 'Sessions Tracked' },
              { value: '89%', label: 'Report Improvement' },
              { value: '4.9★', label: 'User Rating' }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl sm:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-primary-foreground/80 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Is this actually backed by science?',
                a: 'Yes. The techniques used in Stamina Timer are based on established methods like the start-stop technique and edging, which have been studied and recommended by sexual health professionals for decades.'
              },
              {
                q: 'Is my data really private?',
                a: 'Absolutely. Your data is encrypted, stored securely, and never shared with anyone. We don\'t sell data or show ads. You can delete all your data at any time.'
              },
              {
                q: 'How long until I see results?',
                a: 'Most users report noticeable improvement within 2-4 weeks of consistent training (3-4 sessions per week). Everyone\'s different, but the key is consistency.'
              },
              {
                q: 'Is it really free?',
                a: 'Yes, Stamina Timer is completely free to use with all core features. We may add premium features in the future, but the essential training tools will always be free.'
              },
              {
                q: 'Can anyone see that I\'m using this app?',
                a: 'No. The app doesn\'t appear in any shared subscriptions or purchase history. On your device, you can rename the app icon if you want extra privacy.'
              }
            ].map((faq, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <Flame className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Take Control?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of men who are building lasting confidence.
              It&apos;s free, private, and takes just 10 minutes a day.
            </p>
            <Link href="/login">
              <Button size="lg" className="text-lg px-10 h-14 gap-2 shadow-lg shadow-primary/25">
                Start Your Free Training
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required • 100% private • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <TimerIcon className="h-6 w-6 text-primary" />
              <span className="font-semibold">Stamina Timer</span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/license" className="hover:text-primary transition-colors">
                License
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Stamina Timer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
