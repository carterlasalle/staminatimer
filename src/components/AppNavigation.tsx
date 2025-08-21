'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  BarChart3, 
  Brain, 
  Dumbbell, 
  Home, 
  Timer, 
  Settings,
  BookOpen,
  Target,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserMenu } from './UserMenu'
import { ModeToggle } from './mode-toggle'

const navigationItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: Home,
    description: 'Your progress at a glance'
  },
  {
    title: 'Training Timer',
    href: '/training',
    icon: Timer,
    description: 'Stamina building sessions'
  },
  {
    title: 'Kegel Exercises',
    href: '/kegels',
    icon: Dumbbell,
    description: 'Pelvic floor strengthening'
  },
  {
    title: 'Mental Skills',
    href: '/mental',
    icon: Brain,
    description: 'Mind-body techniques'
  },
  {
    title: 'Progress & Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Detailed insights & trends'
  },
  {
    title: 'Goals & Planning',
    href: '/goals',
    icon: Target,
    description: 'Personalized programs'
  }
]

type AppNavigationProps = {
  children: React.ReactNode
}

export function AppNavigation({ children }: AppNavigationProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-card/30 backdrop-blur-sm">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Stamina Hub</h1>
                <p className="text-xs text-muted-foreground">Men's Wellness Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto p-4 text-left",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs opacity-70 truncate">{item.description}</div>
                    </div>
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </Button>
            </Link>
            <Link href="/education">
              <Button variant="ghost" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-3" />
                Education Hub
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h2 className="font-semibold text-lg">
                {navigationItems.find(item => item.href === pathname)?.title || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <ModeToggle />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}