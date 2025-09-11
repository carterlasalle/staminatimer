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
  Target,
  Activity,
  Bot
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserMenu } from './UserMenu'
import { ModeToggle } from './mode-toggle'

const navigationItems = [
  { title: 'Overview', href: '/dashboard', icon: Home },
  { title: 'Training', href: '/training', icon: Timer },
  { title: 'Kegels', href: '/kegels', icon: Dumbbell },
  { title: 'Mental', href: '/mental', icon: Brain },
  { title: 'Analytics', href: '/analytics', icon: BarChart3 },
  { title: 'Goals', href: '/goals', icon: Target },
  { title: 'AI Coach', href: '/ai-coach', icon: Bot }
]

type AppNavigationProps = {
  children: React.ReactNode
}

export function AppNavigation({ children }: AppNavigationProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border/50">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-foreground flex items-center justify-center">
                <Activity className="h-4 w-4 text-background" />
              </div>
              <h1 className="font-semibold">Stamina Hub</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-10 px-3 font-normal",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.title}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border/50">
            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-start h-10 px-3 font-normal">
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Top Bar */}
        <header className="h-14 border-b border-border/50 bg-background">
          <div className="flex h-full items-center justify-between px-6">
            <h2 className="font-medium">
              {navigationItems.find(item => item.href === pathname)?.title || 'Overview'}
            </h2>
            <div className="flex items-center gap-3">
              <ModeToggle />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}