import Image from 'next/image'

type AmbientLandscapeProps = {
  className?: string
  priority?: boolean
}

/**
 * A composable environmental scene. Each asset is intentionally isolated so a
 * final commissioned illustration can replace any layer without changing the
 * layout or motion choreography.
 */
export function AmbientLandscape({ className, priority = false }: AmbientLandscapeProps) {
  return (
    <div className={className} aria-hidden="true">
      <Image
        className="landing-sky absolute inset-0 h-full w-full object-cover"
        src="/landing/hero-sky.svg"
        alt=""
        fill
        priority={priority}
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
    </div>
  )
}
