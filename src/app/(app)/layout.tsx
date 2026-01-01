export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // AppNavigation component handles the full layout including sidebar
  // This layout is kept minimal to avoid duplicate sidebars
  return <>{children}</>
}