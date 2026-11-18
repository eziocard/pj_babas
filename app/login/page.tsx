import Link from "next/link";

const fieldClass =
  "mt-1.5 h-11 w-full rounded-[3px] border border-land-line bg-white px-3 text-sm text-land-ink outline-none transition focus:border-land-accent focus:ring-2 focus:ring-land-accent/20";
const labelClass = "block font-display text-sm font-medium text-land-ink";
const focusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-land-light focus-visible:ring-offset-2 focus-visible:ring-offset-land-accent";

export default function Login() {
  return (
    <main className="flex min-h-screen flex-col bg-paper font-body text-land-ink">
      <header className="w-full bg-land-accent">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex h-[84px] max-w-[1440px] items-center px-5 sm:px-8 lg:px-16"
        >
          <Link href="/" className={`font-display text-[19px] font-semibold text-land-light ${focusClass}`}>
            myCobot Studio
          </Link>
        </nav>
      </header>

      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-5 py-16">
        <h1 className="font-display text-3xl font-semibold">Iniciar sesión</h1>
        <p className="mt-2 text-sm leading-[1.5] text-land-muted">
          Accede a tu cuenta para guardar tus secuencias de movimiento.
        </p>

        <form className="mt-8 space-y-5">
          <label className={labelClass}>
            Correo electrónico
            <input
              className={fieldClass}
              type="email"
              name="email"
              autoComplete="email"
              required
            />
          </label>

          <label className={labelClass}>
            Contraseña
            <input
              className={fieldClass}
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button
            type="submit"
            className="h-12 w-full rounded-[3px] bg-land-accent text-sm font-semibold text-land-light transition-colors hover:bg-land-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-land-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Entrar
          </button>
        </form>

        <p className="mt-5 font-data text-[11px] leading-[1.5] text-land-muted">
          El ingreso con cuenta se activará cuando se conecte el servicio de
          autenticación.
        </p>

        <Link
          href="/"
          className="mt-8 self-start font-data text-xs text-land-muted underline decoration-land-line underline-offset-4 hover:text-land-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-land-accent"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
