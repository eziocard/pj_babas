import Link from "next/link";

const specs = [
  { value: "6", label: "grados de libertad" },
];

const features = [
  {
    title: "Control por ejes",
    copy: "Ajusta los seis ejes con límites reales y observa cómo cada eslabón sigue al anterior.",
  },
  {
    title: "Secuencias animadas",
    copy: "Define pasos, velocidades y pausas para ensayar movimientos completos.",
  },
  {
    title: "Dos modos de cámara",
    copy: "Explora en libertad o apoya el robot sobre una superficie con suelo.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-paper font-body text-land-ink">
      <header className="w-full bg-land-accent">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex h-[84px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-16"
        >
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="relative flex h-7 w-7 items-center justify-center"
            >
              <span className="absolute h-[18px] w-[18px] rotate-45 border-[1.5px] border-land-light" />
              <span className="h-2.5 w-2.5 bg-land-light" />
            </span>
            <Link
              href="/"
              className="font-display text-[19px] font-semibold tracking-tight text-land-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-land-light focus-visible:ring-offset-2 focus-visible:ring-offset-land-accent"
            >
              Proyecto Babas
            </Link>
          </div>

          <Link
            href="/login"
            className="inline-flex h-10 w-[140px] items-center justify-center rounded-[3px] border border-land-light bg-land-light/10 text-sm font-medium text-land-light transition-colors hover:bg-land-light/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-land-light focus-visible:ring-offset-2 focus-visible:ring-offset-land-accent"
          >
            Iniciar sesión
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pb-12 sm:px-8 lg:px-16">
        <section className="grid grid-cols-1 gap-12 pt-16 lg:grid-cols-[minmax(0,660px)_minmax(0,1fr)] lg:gap-9 lg:pt-24">
          <div>
            <h1 className="max-w-[640px] whitespace-pre-line font-display text-[clamp(2.5rem,4.2vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-balance">
              {"Mueve el brazo.\nEntiende el movimiento."}
            </h1>

            <p className="mt-7 max-w-[556px] text-pretty text-[18px] leading-[1.55] text-land-muted">
              Visualiza el myCobot 280 Pi en 3D, controla sus seis ejes y ensaya
              secuencias completas antes de tocar el hardware real.
            </p>

            <Link
              href="/model3d"
              className="mt-14 inline-flex h-14 w-[286px] items-center justify-center rounded-[3px] bg-land-accent text-base font-semibold text-land-light transition-colors hover:bg-land-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-land-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Abrir la herramienta
            </Link>

            <p className="mt-4 font-data text-xs text-land-muted">
              Sin instalación · funciona en el navegador
            </p>
          </div>

          <div
            role="img"
            aria-label="Espacio reservado para una imagen del brazo myCobot 280 Pi en 3D"
            className="relative flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-[2px] border-[1.5px] border-dashed border-land-line bg-white lg:min-h-[520px]"
          >
            <span
              aria-hidden="true"
              className="absolute left-5 top-5 font-data text-[10px] tracking-[0.14em] text-land-muted/70"
            >
              FIG. 01
            </span>

            <span aria-hidden="true" className="absolute inset-4">
              <span className="absolute left-0 top-0 h-4 w-4 border-l border-t border-land-line" />
              <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-land-line" />
              <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-land-line" />
              <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-land-line" />
            </span>

            <div className="flex flex-col items-center gap-2 px-6 text-center">
              <span aria-hidden="true" className="relative mb-3 h-9 w-9">
                <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-land-line" />
                <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-land-line" />
              </span>
              <span className="text-xl font-medium text-land-muted">
                Aquí va una imagen
              </span>
              <span className="font-data text-xs text-land-muted">
                Vista del brazo en 3D
              </span>
            </div>
          </div>
        </section>

        <section
          aria-label="Especificaciones del myCobot 280 Pi"
          className="relative mt-12 grid grid-cols-2 gap-y-8 border-t border-land-line pt-6 lg:grid-cols-4 lg:gap-y-0"
        >
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-land-accent/60 lg:hidden"
          />
          <span
            aria-hidden="true"
            className="absolute left-1/4 top-0 hidden h-3 w-px -translate-y-1/2 bg-land-accent/60 lg:block"
          />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-0 hidden h-3 w-px -translate-y-1/2 bg-land-accent/60 lg:block"
          />
          <span
            aria-hidden="true"
            className="absolute left-3/4 top-0 hidden h-3 w-px -translate-y-1/2 bg-land-accent/60 lg:block"
          />

          {specs.map((spec) => (
            <div key={spec.label}>
              <p className="font-display text-[32px] font-semibold leading-none tabular-nums">
                {spec.value}
              </p>
              <p className="mt-2 font-data text-[11px] text-land-muted">
                {spec.label}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-14 grid grid-cols-1 gap-10 border-t border-land-line pt-6 md:grid-cols-3 md:gap-8">
          {features.map((feature) => (
            <div key={feature.title}>
              <h2 className="font-display text-lg font-semibold text-balance">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-[1.5] text-land-muted">
                {feature.copy}
              </p>
            </div>
          ))}
        </section>

       
      </div>
    </main>
  );
}
