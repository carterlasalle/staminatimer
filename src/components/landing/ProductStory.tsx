'use client'

import { ArrowRight, Pause, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

const STORY_COPY = [
  ['Today', 'One clear session.', 'Open the app and see the practice that counts today.'],
  [
    'Train',
    'Keep the signal simple.',
    'The timer stays quiet while you focus on the next steady block.',
  ],
  [
    'Progress',
    'Evidence changes the target.',
    'The program advances only after enough results repeat.',
  ],
] as const

export function ProductStory() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let context: { revert: () => void } | undefined
    let disposed = false
    void import('@/lib/motion/gsap-runtime').then(async ({ withGsap }) => {
      if (disposed) return
      await withGsap(({ gsap }) => {
        if (disposed) return
        context = gsap.context(() => {
          const states = gsap.utils.toArray<HTMLElement>('.story-state')
          const copies = gsap.utils.toArray<HTMLElement>('.story-copy')
          gsap.set(states.slice(1), { autoAlpha: 0, y: 20, scale: 0.97 })
          gsap.set(copies.slice(1), { autoAlpha: 0, y: 12 })
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: '+=2100',
              pin: true,
              scrub: 0.7,
              anticipatePin: 1,
            },
          })
          timeline
            .to('.story-orbit', { rotate: 8, scale: 1.05, ease: 'none' }, 0)
            .to('.story-frame', { scale: 1.025, ease: 'none' }, 0)
            .to(
              states[0],
              { autoAlpha: 0, y: -26, scale: 0.98, duration: 0.9, ease: 'power2.inOut' },
              0.9
            )
            .to(copies[0], { autoAlpha: 0, y: -12, duration: 0.55, ease: 'power2.inOut' }, 0.92)
            .to(
              states[1],
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'power2.out' },
              1.05
            )
            .to(copies[1], { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 1.1)
            .to('.story-frame', { backgroundColor: '#0b1e2a', duration: 0.8 }, 1.2)
            .to(
              states[1],
              { autoAlpha: 0, y: -26, scale: 0.98, duration: 0.9, ease: 'power2.inOut' },
              2.2
            )
            .to(copies[1], { autoAlpha: 0, y: -12, duration: 0.55, ease: 'power2.inOut' }, 2.22)
            .to(
              states[2],
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'power2.out' },
              2.35
            )
            .to(copies[2], { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 2.4)
            .fromTo(
              '.story-line',
              { strokeDashoffset: 360 },
              { strokeDashoffset: 0, duration: 1.1, ease: 'power1.inOut' },
              2.6
            )
            .fromTo('.story-dot', { scale: 0 }, { scale: 1, stagger: 0.12, duration: 0.25 }, 3.1)
        }, section)
      })
    })

    return () => {
      disposed = true
      context?.revert()
    }
  }, [])

  return (
    <section ref={sectionRef} id="how-it-works" className="landing-story-section">
      <div className="story-orbit" aria-hidden />
      <div className="landing-story-grid">
        <div className="landing-story-copy">
          <p className="landing-kicker text-[#75a3b2]">Practice. Measure. Progress.</p>
          {STORY_COPY.map(([label, heading, detail], index) => (
            <div
              key={label}
              className={`story-copy ${index === 0 ? 'relative' : 'absolute inset-x-0 top-7'}`}
            >
              <p className="mt-8 text-sm text-[#afc9cf]">
                0{index + 1} / {label}
              </p>
              <h2 className="mt-3 max-w-sm font-display text-4xl leading-[0.92] tracking-[-0.055em] text-[#edf3f1] sm:text-5xl">
                {heading}
              </h2>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#afc9cf] sm:text-base">
                {detail}
              </p>
            </div>
          ))}
        </div>

        <div className="story-frame landing-product-frame">
          <div className="story-state story-today">
            <p className="landing-interface-label">Today</p>
            <div className="mt-12 flex items-end justify-between">
              <div>
                <p className="text-sm text-[#afc9cf]">Control session</p>
                <p className="mt-3 font-display text-7xl tracking-[-0.07em] text-[#edf3f1] tabular-nums sm:text-8xl">
                  05:00
                </p>
              </div>
              <span className="landing-interface-status">Ready</span>
            </div>
            <Link href="/login" className="landing-interface-button mt-14">
              Begin session <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="story-state story-train absolute inset-0">
            <p className="landing-interface-label">Control session · 04:18 elapsed</p>
            <div className="mt-20 text-center">
              <p className="font-display text-[clamp(5.5rem,12vw,10rem)] leading-none tracking-[-0.08em] text-[#edf3f1] tabular-nums">
                04:18
              </p>
              <p className="mt-5 text-sm tracking-[0.18em] text-[#d6b46f] uppercase">Steady</p>
            </div>
            <div className="absolute bottom-0 flex w-full items-center justify-between border-t border-[#d7e5e5]/15 pt-5 text-sm text-[#d7e5e5]">
              <button
                className="flex items-center gap-2 transition-colors hover:text-white"
                type="button"
              >
                <Pause className="h-4 w-4" /> Pause
              </button>
              <button
                className="flex items-center gap-2 transition-colors hover:text-white"
                type="button"
              >
                <RotateCcw className="h-4 w-4" /> Need a reset
              </button>
            </div>
          </div>
          <div className="story-state story-progress absolute inset-0">
            <p className="landing-interface-label">Current target</p>
            <div className="mt-9 flex items-end justify-between border-b border-[#d7e5e5]/15 pb-7">
              <p className="font-display text-6xl tracking-[-0.06em] text-[#edf3f1] tabular-nums">
                05:00
              </p>
              <div className="text-right text-sm leading-6 text-[#afc9cf]">
                <p>3 / 4 observations</p>
                <p>2 / 3 passes</p>
              </div>
            </div>
            <svg
              className="mt-10 h-44 w-full overflow-visible"
              viewBox="0 0 520 160"
              fill="none"
              aria-label="Example progress curve"
            >
              <path
                d="M5 136C65 131 86 100 143 108C196 115 202 70 267 83C325 95 351 40 414 48C467 53 478 22 515 16"
                stroke="#75A3B2"
                strokeWidth="3"
                className="story-line"
                strokeDasharray="360"
              />
              {[
                ['112', '111'],
                ['267', '83'],
                ['414', '48'],
                ['515', '16'],
              ].map(([cx, cy]) => (
                <circle
                  key={cx}
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill="#d6b46f"
                  className="story-dot origin-center"
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
