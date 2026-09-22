import { ClarityIdentify } from '@/components/ClarityIdentify'
import { AuthProvider } from '@/contexts/AuthContext'
import { GlobalProvider } from '@/contexts/GlobalContext'

/**
 * The authenticated application shell.
 *
 * A route group does not change URLs, so every page under here keeps the path it
 * had before. What moves is where the client providers live. `AuthProvider` and
 * `GlobalProvider` both reach `supabase-js` — together ~85-100 KiB of JavaScript
 * — and mounting them in the root layout put all of it on every marketing and
 * guide page, none of which reads auth state or a session. The homepage was the
 * only public page that touched the client at all, and only to redirect signed-in
 * visitors, which the middleware now does with the user it has already validated.
 *
 * Everything under this group either sits behind `isPrivatePath` or is `/share`,
 * which needs the client to call its RPC.
 *
 * `AppNavigation` renders the full chrome including the sidebar, so this layout
 * stays minimal to avoid duplicating it.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GlobalProvider>
        <ClarityIdentify />
        {children}
      </GlobalProvider>
    </AuthProvider>
  )
}
