import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Feriado {
  id: string;
  fecha: string;
  createdAt: string;
}

interface GymConfig {
  id: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

async function getFeriados(): Promise<Feriado[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/feriados`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

async function getGymPrice(): Promise<number> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/gym`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return 45000;
  }

  const gym: GymConfig = await response.json();
  return gym.price;
}

function formatDate(fechaStr: string): string {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
}

export default async function InformacionPage() {
  const feriadosPromise = getFeriados();
  const gymPricePromise = getGymPrice();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] rounded-lg transition-all duration-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
        
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-6 sm:mb-8">Información</h1>

        <div className="grid gap-6 sm:gap-8">
          {/* Price Section */}
          <Suspense fallback={<PriceSectionSkeleton />}>
            <PriceSection pricePromise={gymPricePromise} />
          </Suspense>

          {/* Hours Section */}
          <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-4">Horarios</h2>
            <p className="text-lg text-[var(--foreground)]">8:00 a 22:00</p>
            <p className="text-[var(--muted-foreground)] mt-2">Lunes a viernes</p>
          </section>

          {/* Address Section */}
          <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-4">Dirección</h2>
            <p className="text-lg text-[var(--foreground)]">Sargento Cabral 545</p>
            <p className="text-[var(--muted-foreground)] mt-2">Esquina Corrientes</p>
            <a
              href="https://maps.app.goo.gl/oxcpqAWFmFKpfpMU9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-4 py-2 bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] rounded-lg transition-colors"
            >
              Ver en Google Maps
            </a>
          </section>

          {/* Holidays Section */}
          <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]">Feriados</h2>
              <Link
                href="/feriados"
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Ver todos →
              </Link>
            </div>
            <Suspense fallback={<HolidaysSkeleton />}>
              <HolidaysPreviewWrapper feriadosPromise={feriadosPromise} />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  );
}

async function HolidaysPreviewWrapper({
  feriadosPromise,
}: {
  feriadosPromise: Promise<Feriado[]>;
}) {
  const feriados = await feriadosPromise;

  if (feriados.length === 0) {
    return (
      <p className="text-[var(--muted-foreground)]">No hay feriados programados</p>
    );
  }

  return (
    <ul className="space-y-2">
      {feriados.slice(0, 3).map((feriado) => (
        <li key={feriado.id} className="text-[var(--foreground)]">
          {formatDate(feriado.fecha)}
        </li>
      ))}
      {feriados.length > 3 && (
        <li className="text-[var(--muted-foreground)] text-sm">
          +{feriados.length - 3} más...
        </li>
      )}
    </ul>
  );
}

function HolidaysSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-5 w-32 bg-[var(--button-secondary-bg)] rounded animate-pulse" />
      <div className="h-5 w-40 bg-[var(--button-secondary-bg)] rounded animate-pulse" />
    </div>
  );
}

async function PriceSection({
  pricePromise,
}: {
  pricePromise: Promise<number>;
}) {
  const price = await pricePromise;

  return (
    <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-4">
        Precio
      </h2>
      <p className="text-3xl font-bold text-[var(--foreground)]">
        {formatPrice(price)}
      </p>
      <p className="text-[var(--muted-foreground)] mt-2">Abono mensual</p>
    </section>
  );
}

function PriceSectionSkeleton() {
  return (
    <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-4">
        Precio
      </h2>
      <div className="h-10 w-32 bg-[var(--button-secondary-bg)] rounded animate-pulse" />
    </section>
  );
}
