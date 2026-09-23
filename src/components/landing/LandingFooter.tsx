import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="flex flex-col gap-8 border-t border-landing-soft/35 pt-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-landing-paper"
          >
            Stamina
          </Link>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-landing-soft">
            Private practice. Clear signals. Progress you can see.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-landing-mist"
        >
          <Link href="/guides" className="hover:text-white">
            Guides
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
          <a href="https://github.com/carterlasalle/staminatimer" className="hover:text-white">
            GitHub
          </a>
        </nav>
      </div>
      <p className="mt-10 text-xs text-landing-soft">
        © {new Date().getFullYear()} Stamina Timer · Not a medical device.
      </p>
    </footer>
  )
}
