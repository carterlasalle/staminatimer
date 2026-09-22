import Image from 'next/image'

type AmbientLandscapeProps = {
  className?: string
  priority?: boolean
}

/**
 * The commissioned hero plate remains the visual anchor. The translucent
 * atmosphere layers below are deliberately separate so the scene can breathe
 * without asking a background image to behave like a video.
 */
export function AmbientLandscape({ className, priority = false }: AmbientLandscapeProps) {
  return (
    <div className={className} aria-hidden="true">
      <Image
        className="landing-sky absolute inset-0 h-full w-full object-cover"
        src="/landing/hero-landscape.png"
        alt=""
        fill
        priority={priority}
        sizes="100vw"
      />
      <div className="landing-lake absolute inset-x-0 bottom-0 h-[42%]" />
      <div className="landing-mist absolute inset-0" />
      <div className="landing-foreground absolute inset-0" />
    </div>
  )
}
