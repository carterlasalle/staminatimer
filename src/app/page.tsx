'use client'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

import { ModeToggle } from '@/components/mode-toggle'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { LineChart, Share2, Shield, Timer as TimerIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    async function checkSession(): Promise<void> {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard')
      }
    }
    checkSession()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col relative z-10">
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <div className="flex items-center">
                <TimerIcon className="h-8 w-8 text-primary shrink-0" />
                <span className="ml-2 text-2xl font-bold">Stamina Timer</span>
              </div>
            </div>

            <div className="hidden md:flex gap-6">
              <Link href="/license" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                License
              </Link>
              <Link href="/privacy" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <ModeToggle />
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-16 sm:py-32">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Build Better <span className="text-primary">Control</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl">
          Develop stamina and control through structured practice sessions with detailed progress tracking.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/login">
            <Button size="lg" className="text-lg px-8">
              Get Started
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Why Use Our Platform?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<TimerIcon className="h-10 w-10" />}
              title="Precise Tracking"
              description="Advanced timing with edge control and detailed session analysis"
            />
            <FeatureCard 
              icon={<LineChart className="h-10 w-10" />}
              title="Progress Insights"
              description="Track improvement patterns and build lasting control over time"
            />
            <FeatureCard 
              icon={<Share2 className="h-10 w-10" />}
              title="Export Data"
              description="Review your progress with detailed analytics and export options"
            />
            <FeatureCard 
              icon={<Shield className="h-10 w-10" />}
              title="Complete Privacy"
              description="Your personal data stays private with secure authentication"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Join Others Building Better Control</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <StatCard number="10k+" label="Active Users" />
            <StatCard number="1M+" label="Sessions Tracked" />
            <StatCard number="15+" label="Achievements to Unlock" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 bg-background/90">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/license" className="hover:text-primary transition-colors">
                License
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Stamina Timer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
