'use client'

import { useEffect, useRef } from 'react'

const TARGETS = [
  '2:00',
  '2:30',
  '3:00',
  '3:30',
  '4:00',
  '4:30',
  '5:00',
  '6:00',
  '7:00',
  '8:00',
  '9:00',
  '10:00',
]

export function ProgressLandscape() {
  const sectionRef = useRef<HTMLElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const path = pathRef.current
    if (!section || !path || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const length = path.getTotalLength()
    path.style.strokeDasharray = `${length}`
    path.style.strokeDashoffset = `${length}`
    let context: { revert: () => void } | undefined
    let disposed = false
    void import('@/lib/motion/gsap-runtime').then(async ({ withGsap }) => {
      if (disposed) return
      await withGsap(({ gsap }) => {
        if (disposed) return
        context = gsap.context(() => {
          gsap
            .timeline({ scrollTrigger: { trigger: section, start: 'top 70%', once: true } })
            .fromTo(
              '.progress-baseline',
              { scaleX: 0 },
              { scaleX: 1, duration: 0.65, transformOrigin: 'left', ease: 'power2.out' }
            )
            .to(path, { strokeDashoffset: 0, duration: 1.55, ease: 'power2.inOut' }, 0.18)
            .fromTo(
              '.progress-mark',
              { scale: 0, opacity: 0 },
              { scale: 1, opacity: 1, stagger: 0.11, duration: 0.25, ease: 'power2.out' },
              0.8
            )
            .fromTo(
              '.progress-target-line',
              { scaleY: 0 },
              { scaleY: 1, duration: 0.55, transformOrigin: 'bottom', ease: 'power2.out' },
              1.1
            )
        }, section)
      })
    })
    return () => {
      disposed = true
      context?.revert()
    }
  }, [])

  return (
    <section ref={sectionRef} id="progress" className="landing-progress-section">
      <div className="landing-progress-copy">
        <p className="text-sm text-[#477d91]">Targets are earned.</p>
        <h2 className="mt-4 max-w-lg font-display text-5xl leading-[0.92] tracking-[-0.06em] text-[#edf3f1] sm:text-7xl">
          Progress only moves when performance repeats.
        </h2>
        <p className="mt-6 max-w-md text-base leading-relaxed text-[#afc9cf]">
          One good session doesn&apos;t move the target. Repeated results do.
        </p>
      </div>
      <div className="landing-ridge-chart" aria-label="Example progression from two to ten minutes">
        <svg viewBox="0 0 1200 500" className="h-auto w-full overflow-visible" role="img">
          <title>A representative target progression path</title>
          <line
            x1="45"
            y1="395"
            x2="1150"
            y2="395"
            className="progress-baseline"
            stroke="#477d91"
            strokeWidth="1"
            opacity=".55"
          />
          <path
            ref={pathRef}
            d="M48 390C122 383 132 340 202 348C259 355 265 292 337 301C392 307 426 244 498 252C569 261 591 184 668 199C740 213 759 143 828 152C892 160 915 95 982 103C1045 110 1081 44 1150 51"
            fill="none"
            stroke="#d7e5e5"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="668"
            y1="395"
            x2="668"
            y2="174"
            className="progress-target-line"
            stroke="#d6b46f"
            strokeWidth="2"
          />
          <g fill="#d6b46f">
            {[
              ['202', '348'],
              ['498', '252'],
              ['668', '199'],
              ['828', '152'],
              ['1150', '51'],
            ].map(([cx, cy]) => (
              <circle key={cx} cx={cx} cy={cy} r="7" className="progress-mark origin-center" />
            ))}
          </g>
          <text x="684" y="188" fill="#d6b46f" fontSize="18" fontFamily="var(--font-body)">
            Current target · 5:00
          </text>
        </svg>
        <div className="mt-5 grid grid-cols-4 gap-x-3 gap-y-2 border-t border-[#477d91]/50 pt-4 text-xs text-[#75a3b2] sm:grid-cols-6 lg:grid-cols-12">
          {TARGETS.map((target) => (
            <span key={target} className={target === '5:00' ? 'text-[#d6b46f]' : ''}>
              {target}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
