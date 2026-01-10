'use client'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Timer as TimerIcon, Zap, TrendingUp, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Loading } from '@/components/ui/loading'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session) {
        setIsLoading(true)
        toast.success('Welcome back!')
        router.push('/dashboard')
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleGoogleSignIn = async (): Promise<void> => {
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
      toast.error('Failed to sign in with Google')
      setGoogleLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading text="Redirecting to dashboard..." className="text-lg" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen safe-area-top safe-area-bottom">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 xl:px-16 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center mb-8">
            <TimerIcon className="h-12 w-12 text-primary" />
            <span className="ml-3 text-3xl font-bold">Stamina Timer</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
            Build Better <span className="text-primary">Control</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Develop stamina and control through structured practice with detailed progress tracking and analytics.
          </p>
          
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Precise Control</h3>
                <p className="text-sm text-muted-foreground">Advanced timing with detailed edge tracking and session analysis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Progress Insights</h3>
                <p className="text-sm text-muted-foreground">Data-driven analytics to track improvement over time</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Private & Secure</h3>
                <p className="text-sm text-muted-foreground">Your personal wellness data stays completely private</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <span>Trusted by thousands for personal wellness goals</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8 lg:py-0 lg:flex-none lg:w-96 xl:w-[480px] overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center pt-4">
            <Link href="/" className="inline-flex items-center justify-center mb-2 hover:opacity-80 transition-opacity">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mr-2">
                <TimerIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">Stamina Timer</span>
            </Link>
          </div>

          <Card className="border-none shadow-2xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">
                Welcome Back
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Sign in to continue your training journey
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Button 
                variant="outline" 
                className="w-full h-12 text-base font-medium border-2 hover:bg-accent hover:border-primary/50 transition-all duration-200"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loading className="mr-2" size="sm" />
                ) : (
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-medium">
                    Or continue with email
                  </span>
                </div>
              </div>

              <div className="auth-container">
                <Auth
                  supabaseClient={supabase}
                  appearance={{
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: 'hsl(var(--primary))',
                          brandAccent: 'hsl(var(--primary))',
                        },
                        borderWidths: {
                          buttonBorderWidth: '2px',
                          inputBorderWidth: '2px',
                        },
                        radii: {
                          borderRadiusButton: '8px',
                          buttonBorderRadius: '8px',
                          inputBorderRadius: '8px',
                        },
                      },
                    },
                    className: {
                      container: 'auth-container',
                      button: 'auth-button transition-all duration-200',
                      input: 'auth-input transition-all duration-200',
                      label: 'auth-label font-medium',
                      message: 'auth-message',
                    },
                  }}
                  providers={[]}
                  redirectTo={`${window.location.origin}/auth/callback`}
                  theme="dark"
                  localization={{
                    variables: {
                      sign_in: {
                        button_label: 'Sign in to your account',
                        loading_button_label: 'Signing in...',
                      },
                      sign_up: {
                        button_label: 'Create your account',
                        loading_button_label: 'Creating account...',
                      },
                    },
                  }}
                />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  New to Stamina Timer?{' '}
                  <span className="text-primary font-medium cursor-pointer hover:underline">
                    Create an account above
                  </span>
                </p>
                <Link 
                  href="/" 
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowRight className="mr-1 h-3 w-3 rotate-180" />
                  Back to home
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center text-xs text-muted-foreground space-y-2">
            <p>
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 