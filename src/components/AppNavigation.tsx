'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Home,
  Timer,
  TrendingUp,
  Bot,
  Settings,
  Menu,
  X,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserMenu } from './UserMenu'
import { ModeToggle } from './mode-toggle'

const navigationItems = [
  { title: 'Home', href: '/dashboard', icon: Home },
  { title: 'Train', href: '/training', icon: Timer },
  { title: 'Progress', href: '/progress', icon: TrendingUp },
  { title: 'AI Coach', href: '/ai-coach', icon: Bot },
  { title: 'Guides', href: '/guides', icon: BookOpen }
]

type AppNavigationProps = {
  children: React.ReactNode
}

export function AppNavigation({ children }: AppNavigationProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, shown on lg+ */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r border-border/50 bg-background transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-56",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-border/50 safe-area-top">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="h-8 w-8 rounded-lg bg-linear-to-br from-primary to-accent flex items-center justify-center">
                  <Timer className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="font-semibold text-lg">Stamina Timer</h1>
              </Link>
              {/* Close button for mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link key={item.href} href={item.href} className="block">
                  <div
                    className={cn(
                      "flex items-center w-full h-11 lg:h-10 px-3 rounded-md text-base lg:text-sm font-normal transition-colors",
                      "hover:bg-accent/50 hover:text-accent-foreground",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 lg:h-4 lg:w-4 mr-3 shrink-0" />
                    {item.title}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 lg:p-4 border-t border-border/50">
            <Link href="/settings" className="block">
              <div
                className={cn(
                  "flex items-center w-full h-11 lg:h-10 px-3 rounded-md text-base lg:text-sm font-normal transition-colors",
                  "hover:bg-accent/50 hover:text-accent-foreground",
                  pathname === '/settings'
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Settings className="h-5 w-5 lg:h-4 lg:w-4 mr-3 shrink-0" />
                Settings
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-border/50 bg-background shrink-0 safe-area-top">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="font-medium text-sm lg:text-base truncate">
                {navigationItems.find(item => item.href === pathname)?.title ||
                 (pathname === '/settings' ? 'Settings' : 'Home')}
              </h2>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <ModeToggle />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content - Account for bottom nav on mobile */}
        <div className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border/50 lg:hidden z-30 safe-area-bottom">
        <div className="flex h-full items-center justify-around px-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                  "active:bg-accent/50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.title}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
