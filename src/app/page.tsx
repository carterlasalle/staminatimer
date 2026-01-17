'use client'

export const dynamic = 'force-dynamic'

import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import {
  Timer,
  TrendingUp,
  Shield,
  Target,
  Trophy,
  Clock,
  Star,
  ArrowRight,
  ArrowDown,
  Brain,
  Flame,
  Lock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

// ===== COMPONENTS =====

// Border Beam Button
function BeamButton({ children, className = '', ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={`border-beam relative bg-primary text-primary-foreground hover:bg-primary/90 ${className}`}
      {...props}
    >
      {children}
    </Button>
  )
}

// Flashlight Card with mouse tracking
function FlashlightCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cardRef.current.style.setProperty('--mouse-x', `${x}px`)
    cardRef.current.style.setProperty('--mouse-y', `${y}px`)
  }, [])

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`flashlight-card rounded-2xl p-6 ${className}`}
    >
      {children}
    </div>
  )
}

// Animated text reveal
function AnimatedText({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.05,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

// Scroll-triggered section
function ScrollSection({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// Feature Carousel
function FeatureCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const features = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Precision Timer',
      description: 'Track active time, edge duration, and rest periods with millisecond accuracy. Our intelligent timer adapts to your rhythm.',
      color: 'from-emerald-500/20 to-teal-500/20'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI Coach',
      description: 'Get personalized tips and recommendations powered by advanced AI that learns your patterns and optimizes your training.',
      color: 'from-amber-500/20 to-orange-500/20'
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Achievements',
      description: 'Stay motivated with gamified progress. Unlock badges, hit milestones, and watch your confidence grow with every session.',
      color: 'from-violet-500/20 to-purple-500/20'
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [features.length])

  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % features.length)
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + features.length) % features.length)

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-3xl">
        <motion.div
          className="flex"
          animate={{ x: `-${activeIndex * 100}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {features.map((feature, i) => (
            <div key={i} className="w-full flex-shrink-0 p-8 md:p-12">
              <div className={`bg-gradient-to-br ${feature.color} rounded-2xl p-8 md:p-12 min-h-[300px] flex flex-col justify-center`}>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">{feature.title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={prevSlide}
          className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          {features.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-8 bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>
        <button
          onClick={nextSlide}
          className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// Testimonials Marquee
function TestimonialsMarquee() {
  const testimonials = [
    { quote: "After 3 weeks, I noticed real improvement. The data tracking is incredible.", author: "Michael T.", rating: 5 },
    { quote: "Finally, a scientific approach that actually works. Changed my life.", author: "James R.", rating: 5 },
    { quote: "The AI coach gave me insights I never expected. Highly recommend.", author: "David K.", rating: 5 },
    { quote: "Private, effective, and the progress charts keep me motivated.", author: "Chris M.", rating: 5 },
    { quote: "Best investment in myself. Results speak for themselves.", author: "Alex P.", rating: 5 },
    { quote: "The achievements system makes training actually fun.", author: "Ryan S.", rating: 5 },
  ]

  return (
    <div className="marquee marquee-mask py-8">
      <div className="marquee-content">
        {testimonials.map((t, i) => (
          <div key={i} className="flex-shrink-0 w-[350px] p-6 rounded-2xl bg-card border border-border">
            <div className="flex gap-1 mb-4">
              {[...Array(t.rating)].map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <p className="text-foreground mb-4">&ldquo;{t.quote}&rdquo;</p>
            <p className="text-sm text-muted-foreground">{t.author}</p>
          </div>
        ))}
      </div>
      <div className="marquee-content" aria-hidden>
        {testimonials.map((t, i) => (
          <div key={i} className="flex-shrink-0 w-[350px] p-6 rounded-2xl bg-card border border-border">
            <div className="flex gap-1 mb-4">
              {[...Array(t.rating)].map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <p className="text-foreground mb-4">&ldquo;{t.quote}&rdquo;</p>
            <p className="text-sm text-muted-foreground">{t.author}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Stats counter
function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (isInView) {
      const duration = 2000
      const steps = 60
      const increment = value / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setCount(value)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  )
}

// ===== MAIN PAGE =====
export default function Home() {
  const router = useRouter()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95])

  useEffect(() => {
    async function checkSession(): Promise<void> {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkSession()
  }, [router])

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px]"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[128px]"
          animate={{
            x: [0, -50, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Timer className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-lg">Stamina Timer</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
            </div>

            <div className="flex items-center gap-3">
              <ModeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Log In</Button>
              </Link>
              <Link href="/login">
                <BeamButton size="sm">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </BeamButton>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center pt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Science-backed stamina training
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight mb-8 overflow-hidden">
            <AnimatedText text="Last Longer." className="block" delay={0.2} />
            <span className="block overflow-hidden">
              <motion.span
                className="inline-block text-gradient"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                Feel Confident.
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            The training app that helps you build lasting control.
            Track progress, understand patterns, see real improvement in weeks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/login">
              <BeamButton size="lg" className="text-lg px-8 h-14 rounded-full glow-teal">
                Start Training Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </BeamButton>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-full">
                See How It Works
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              100% Private
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Free Forever
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              4.9/5 Rating
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 scroll-indicator"
          >
            <ArrowDown className="w-6 h-6 text-muted-foreground" />
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <ScrollSection className="py-24 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter value={10000} suffix="+" label="Active Users" />
            <StatCounter value={500000} suffix="+" label="Sessions Tracked" />
            <StatCounter value={89} suffix="%" label="Report Improvement" />
            <StatCounter value={4.9} suffix="★" label="Average Rating" />
          </div>
        </div>
      </ScrollSection>

      {/* Features Section */}
      <ScrollSection id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built with precision, designed for results
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Clock className="w-6 h-6" />, title: 'Precision Timer', description: 'Track every second with accuracy' },
              { icon: <TrendingUp className="w-6 h-6" />, title: 'Analytics', description: 'Visualize your improvement' },
              { icon: <Target className="w-6 h-6" />, title: 'Goals', description: 'Set and crush milestones' },
              { icon: <Brain className="w-6 h-6" />, title: 'AI Coach', description: 'Personalized recommendations' },
              { icon: <Trophy className="w-6 h-6" />, title: 'Achievements', description: 'Gamified motivation' },
              { icon: <Lock className="w-6 h-6" />, title: 'Privacy First', description: 'Your data stays yours' },
            ].map((feature, i) => (
              <FlashlightCard key={i} className="group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </FlashlightCard>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* Feature Carousel Section */}
      <ScrollSection id="how-it-works" className="py-24 bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Three steps to lasting improvement
            </p>
          </div>
          <FeatureCarousel />
        </div>
      </ScrollSection>

      {/* Testimonials Section */}
      <ScrollSection id="testimonials" className="py-24">
        <div className="text-center mb-12 px-4">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Real Results
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands who transformed their confidence
          </p>
        </div>
        <TestimonialsMarquee />
      </ScrollSection>

      {/* CTA Section */}
      <ScrollSection className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            whileInView={{ scale: [0.9, 1] }}
            className="relative p-12 md:p-16 rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-accent/20 rounded-3xl" />
            <div className="absolute inset-0 grid-pattern opacity-50" />
            <div className="relative z-10">
              <Flame className="w-16 h-16 text-primary mx-auto mb-8" />
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Take Control?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands building lasting confidence. Free, private, 10 minutes a day.
              </p>
              <Link href="/login">
                <BeamButton size="lg" className="text-lg px-10 h-14 rounded-full">
                  Start Your Free Training
                  <ArrowRight className="w-5 h-5 ml-2" />
                </BeamButton>
              </Link>
              <p className="mt-6 text-sm text-muted-foreground">
                No credit card • 100% private • Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      </ScrollSection>

      {/* Footer */}
      <footer className="border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <Timer className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg">Stamina Timer</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-sm">
                Science-backed stamina training app for men. Build lasting control
                with data-driven progress tracking and AI-powered coaching.
              </p>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <nav className="flex flex-col gap-2">
                <Link href="/guides" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Training Guides
                </Link>
                <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Get Started
                </Link>
              </nav>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <nav className="flex flex-col gap-2">
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <Link href="/license" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  License
                </Link>
              </nav>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Stamina Timer. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              100% Private • No Ads • No Data Selling
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
