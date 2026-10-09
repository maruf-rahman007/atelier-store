import Image from "next/image";
import Link from "next/link";
import { hero } from "@/lib/catalog";

export function Hero() {
  const [first, second] = hero.images;

  return (
    <section
      aria-labelledby="hero-title"
      className="hero min-h-[calc(100svh-var(--header-height)-2.25rem)] bg-ink text-canvas"
    >
      <div className="grid md:grid-cols-2">
        <div className="relative">
          <Image
            src={first.src}
            alt={first.alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-[50%_30%]"
          />
        </div>
        <div className="relative hidden md:block">
          <Image
            src={second.src}
            alt={second.alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 768px) 50vw, 1px"
            className="object-cover object-[50%_20%]"
          />
        </div>
      </div>

      <div className="scrim" aria-hidden="true" />

      <div className="container-page relative flex flex-col justify-end pb-10 pt-24 md:pb-14">
        <h1
          id="hero-title"
          className="max-w-[9ch] text-[clamp(3rem,1rem+8.5vw,11rem)] font-light leading-[0.88] tracking-[-0.045em]"
        >
          {hero.title}
        </h1>
        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <p className="max-w-[34ch] text-body-lg">{hero.description}</p>
          <Link href={hero.action.href} className="btn btn-inverse self-start">
            {hero.action.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
