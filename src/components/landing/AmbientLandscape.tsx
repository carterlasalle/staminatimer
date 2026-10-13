'use client'

import Image from 'next/image'
import { useState } from 'react'

type AmbientLandscapeProps = {
  className?: string
  priority?: boolean
}

/**
 * The hero plate is a photographic landscape (`hero-landscape.png`) rendered
 * fullscreen. The vector layers underneath are the fallback scene: if the
 * plate is missing or fails to decode, they still fill the frame, so the hero
 * never ships a partial image. Each asset stays isolated so a replacement
 * plate can be dropped into `public/landing/` without touching layout or
 * motion choreography.
 */
export function AmbientLandscape({ className, priority = false }: AmbientLandscapeProps) {
  const [plateFailed, setPlateFailed] = useState(false)

  return (
    <div
      className={className}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <Image
        className="landing-sky absolute inset-0 h-full w-full object-cover"
        src="/landing/hero-sky.svg"
        alt=""
        fill
        sizes="100vw"
      />
      <Image
        className="landing-mountains absolute inset-0 h-full w-full object-cover"
        src="/landing/hero-mountains.svg"
        alt=""
        fill
        sizes="100vw"
      />
      <Image
        className="landing-lake absolute inset-0 h-full w-full object-cover"
        src="/landing/hero-lake.svg"
        alt=""
        fill
        sizes="100vw"
      />
      <Image
        className="landing-shore absolute inset-0 h-full w-full object-cover"
        src="/landing/hero-shore.svg"
        alt=""
        fill
        sizes="100vw"
      />
      <Image
        className="landing-mist absolute inset-0 h-full w-full object-cover"
        src="/landing/hero-mist.svg"
        alt=""
        fill
        sizes="100vw"
      />
      <Image
        className="landing-foreground absolute inset-0 h-full w-full object-cover"
        src="/landing/hero-foreground.svg"
        alt=""
        fill
        sizes="100vw"
      />
      {!plateFailed && (
        <Image
          className="landing-plate absolute inset-0 h-full w-full object-cover"
          src="/landing/hero-landscape.png"
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          style={{ objectPosition: 'center' }}
          onError={() => setPlateFailed(true)}
        />
      )}
    </div>
  )
}
