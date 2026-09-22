'use client'

import { AmbientLandscape } from '@/components/landing/AmbientLandscape'
import { ArrowDownRight, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

export function CinematicHero() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const scene = sceneRef.current
    const hero = heroRef.current
    if (!scene || !hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const move = (event: PointerEvent) => {
      const rect = scene.getBoundingClientRect()
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    }
    const reset = () => {
      targetX = 0
      targetY = 0
    }
    const render = () => {
      currentX += (targetX - currentX) * 0.045
      currentY += (targetY - currentY) * 0.045
      scene.style.setProperty('--px', currentX.toFixed(3))
      scene.style.setProperty('--py', currentY.toFixed(3))
      frame = requestAnimationFrame(render)
    }

    scene.addEventListener('pointermove', move)
    scene.addEventListener('pointerleave', reset)
    frame = requestAnimationFrame(render)

    let context: { revert: () => void } | undefined
    let disposed = false
    void import('@/lib/motion/gsap-runtime').then(async ({ withGsap }) => {
      if (disposed) return
      await withGsap(({ gsap }) => {
        if (disposed) return
        context = gsap.context(() => {
          gsap.fromTo(scene, { scale: 1.012 }, { scale: 1, duration: 1.15, ease: 'power3.out' })
          gsap.fromTo(
            '.hero-arrival',
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, delay: 0.18, ease: 'power3.out' }
          )
          gsap
            .timeline({
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.7,
              },
            })
            .to('.landing-foreground', { yPercent: -11, scale: 1.04, ease: 'none' }, 0)
            .to('.landing-mist', { xPercent: 7, opacity: 0.66, ease: 'none' }, 0)
            .to('.landing-hero-copy', { yPercent: -20, opacity: 0.42, ease: 'none' }, 0)
            .to(scene, { filter: 'brightness(0.76) saturate(0.85)', ease: 'none' }, 0)
        }, hero)
      })
    })

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      scene.removeEventListener('pointermove', move)
      scene.removeEventListener('pointerleave', reset)
      context?.revert()
    }
  }, [])

  return (
    <section ref={heroRef} className="landing-hero-wrap" aria-label="Stamina Timer introduction">
      <div ref={sceneRef} className="landing-hero-scene">
        <AmbientLandscape className="absolute inset-0 overflow-hidden" priority />
        <div className="landing-hero-scrim" aria-hidden />
        <div className="landing-hero-copy">
          <p className="hero-arrival landing-kicker">Structured private practice</p>
          <h1 className="landing-hero-title mt-4 max-w-[8ch] font-display text-[clamp(3.4rem,7.4vw,8.2rem)] font-semibold leading-[0.87] tracking-[-0.07em] text-[#edf3f1]">
            Build control
            <br />
            that lasts.
          </h1>
          <p className="hero-arrival mt-7 max-w-md text-base leading-relaxed text-[#d7e5e5] sm:text-lg">
            Private, structured training for building stamina through repeatable practice and
            measurable progression.
          </p>
          <div className="hero-arrival mt-8 flex flex-wrap items-center gap-4">
            <Link href="/login" className="landing-primary-action">
              Start training <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a href="#how-it-works" className="landing-text-action">
              See how it works <ArrowDownRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
        <p className="landing-hero-caption" aria-hidden>
          Blue hour / open water / steady work
        </p>
      </div>
    </section>
  )
}
