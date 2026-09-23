import Image from 'next/image'

type AmbientLandscapeProps = {
  className?: string
  priority?: boolean
}

export function AmbientLandscape({ className, priority = false }: AmbientLandscapeProps) {
  return (
    <div
      className={className}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <Image
        className="landing-sky h-full w-full object-cover"
        src="/landing/hero-landscape.png"
        alt=""
        width={1672}
        height={941}
        priority={priority}
        sizes="100vw"
        style={{ objectPosition: 'center' }}
      />
      <div className="landing-lake absolute inset-x-0 bottom-0 h-[42%]" />
      <div className="landing-mist absolute inset-0" />
      <div className="landing-foreground absolute inset-0" />
    </div>
  )
}
