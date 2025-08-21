export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-card/30 backdrop-blur-sm">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SH</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">Stamina Hub</h1>
                <p className="text-xs text-muted-foreground">Men's Wellness Platform</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Navigation will be rendered by individual pages */}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}