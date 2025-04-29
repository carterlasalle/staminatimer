'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import Link from 'next/link'
import { Timer as TimerIcon, LineChart, Share2, Shield } from 'lucide-react'
import { StatCard } from '@/components/StatCard'

export default function Home(): JSX.Element {
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
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-8">
              <div className="flex items-center">
                <TimerIcon className="h-8 w-8 text-primary" />
                <span className="ml-2 text-2xl font-bold">Stamina Timer</span>
              </div>
              <Link 
                href="/license" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                License
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
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Master Your <span className="text-primary">Stamina</span>
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl">
          Track, analyze, and improve your endurance with our advanced timing and analytics platform.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
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
      <section id="features" className="py-24 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<TimerIcon className="h-10 w-10" />}
              title="Precision Timer"
              description="Accurate timing with edge detection and detailed session tracking"
            />
            <FeatureCard 
              icon={<LineChart className="h-10 w-10" />}
              title="Analytics"
              description="Comprehensive data analysis and progress tracking over time"
            />
            <FeatureCard 
              icon={<Share2 className="h-10 w-10" />}
              title="Share Progress"
              description="Export and share your training data with customizable privacy"
            />
            <FeatureCard 
              icon={<Shield className="h-10 w-10" />}
              title="Privacy First"
              description="Your data is secure and private with end-to-end encryption"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <StatCard number="10k+" label="Active Users" />
            <StatCard number="1M+" label="Sessions Tracked" />
            <StatCard number="99.9%" label="Uptime" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
            <p className="text-center text-muted-foreground">
              © 2024 Stamina Timer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }): JSX.Element {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
