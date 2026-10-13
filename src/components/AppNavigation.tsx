'use client'

import { ModeToggle } from '@/components/mode-toggle'
import { UserMenu } from '@/components/UserMenu'
import { cn } from '@/lib/utils'
import { BookOpen, Bot, Compass, Settings, Timer, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavigationItem = {
  title: string
  href: string
  icon: typeof Timer
}

const primary: NavigationItem[] = [
  { title: 'Today', href: '/dashboard', icon: Compass },
  { title: 'Train', href: '/training', icon: Timer },
  { title: 'Progress', href: '/progress', icon: TrendingUp },
  { title: 'Coach', href: '/ai-coach', icon: Bot },
]

const secondary: NavigationItem[] = [
  { title: 'Program', href: '/program', icon: Timer },
  { title: 'Guides', href: '/guides', icon: BookOpen },
  { title: 'Settings', href: '/settings', icon: Settings },
]

type AppNavigationProps = { children: React.ReactNode }

function active(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function RailLink({
  item,
  pathname,
  compact = false,
}: {
  item: NavigationItem
  pathname: string
  compact?: boolean
}) {
  const isActive = active(pathname, item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 border-l-2 px-3 py-2 text-sm transition-colors',
        isActive
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
        compact &&
          'flex-1 flex-col justify-center gap-1 border-l-0 border-t-2 px-1 py-2 text-[10px]'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', compact && 'h-5 w-5')} aria-hidden />
      {item.title}
    </Link>
  )
}

/** A quiet navigation rail. Active guided sessions intentionally render outside it. */
export function AppNavigation({ children }: AppNavigationProps) {
  const pathname = usePathname()
  const immersive = pathname.startsWith('/program/session')

  if (immersive) return <>{children}</>

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)]">
      <aside className="hidden h-screen border-r border-border/60 px-4 py-6 lg:sticky lg:top-0 lg:flex lg:flex-col lg:overflow-y-auto">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 font-display text-lg font-semibold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center border border-primary/35 bg-primary/10 text-primary">
            <Timer className="h-4 w-4" aria-hidden />
          </span>
          Stamina
        </Link>
        <nav aria-label="Primary" className="mt-12 space-y-1">
          {primary.map((item) => (
            <RailLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <nav aria-label="Secondary" className="mt-10 border-t border-border/60 pt-5 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            More
          </p>
          {secondary.map((item) => (
            <RailLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-1 border-t border-border/60 pt-4">
          <ModeToggle />
          <UserMenu />
        </div>
      </aside>

      <main className="min-w-0 pb-[4.5rem] lg:pb-0">
        <header className="flex h-14 items-center justify-between border-b border-border/60 px-4 lg:hidden">
          <Link href="/dashboard" className="font-display text-lg font-semibold tracking-tight">
            Stamina
          </Link>
          <div className="flex items-center gap-1">
            <ModeToggle />
            <UserMenu />
          </div>
        </header>
        {children}
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 flex h-[4.5rem] border-t border-border/60 bg-background/95 px-1 backdrop-blur lg:hidden safe-area-bottom"
      >
        {primary.map((item) => (
          <RailLink key={item.href} item={item} pathname={pathname} compact />
        ))}
      </nav>
    </div>
  )
}
