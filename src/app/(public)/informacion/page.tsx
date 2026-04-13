import { Suspense } from "react";
import Link from "next/link";
import { House, AlertCircle, Tag, Percent } from "lucide-react";
import { DataResult, ok, err } from "@/lib/data-result";
import { getToday } from "@/lib/dates";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Feriado {
  id: string;
  fecha: string;
  todo_dia: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
  createdAt: string;
}

interface GymConfig {
  id: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

interface Promocion {
  id: string;
  titulo: string;
  descripcion: string;
  precio: string;
  activo: boolean;
  createdAt: string;
}

interface DescuentoDuracion {
  id: number;
  meses: number;
  porcentaje: number;
}

async function getFeriados(): Promise<DataResult<Feriado[]>> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseUrl}/api/feriados`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[getFeriados] API returned non-OK status:", response.status);
      return err([]);
    }

    return ok(await response.json());
  } catch (error) {
    console.error("[getFeriados] Failed to fetch feriados:", error);
    return err([]);
  }
}

async function getGymPrice(): Promise<DataResult<number | null>> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseUrl}/api/gym`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[getGymPrice] API returned non-OK status:", response.status);
      return err(null);
    }

    const gym: GymConfig = await response.json();
    return ok(gym.price);
  } catch (error) {
    console.error("[getGymPrice] Failed to fetch gym price:", error);
    return err(null);
  }
}

async function getPromociones(): Promise<DataResult<Promocion[]>> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseUrl}/api/promociones`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[getPromociones] API returned non-OK status:", response.status);
      return err([]);
    }

    const data = await response.json();
    return ok(data.promociones);
  } catch (error) {
    console.error("[getPromociones] Failed to fetch promociones:", error);
    return err([]);
  }
}

async function getDescuentos(): Promise<DataResult<DescuentoDuracion[]>> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseUrl}/api/descuentos-duracion`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[getDescuentos] API returned non-OK status:", response.status);
      return err([]);
    }

    const data = await response.json();
    return ok(data.descuentos);
  } catch (error) {
    console.error("[getDescuentos] Failed to fetch descuentos:", error);
    return err([]);
  }
}

function formatDate(fechaStr: string): string {
  // Use local time to avoid timezone offset issues
  const fecha = new Date(`${fechaStr}T00:00:00`);
  return fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatFeriadoDisplay(feriado: Feriado): string {
  if (feriado.todo_dia) {
    return "Todo el día";
  }
  if (feriado.hora_inicio && feriado.hora_fin) {
    return `Abierto de ${feriado.hora_inicio} a ${feriado.hora_fin}`;
  }
  return "Todo el día";
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
}

export default async function InformacionPage() {
  const [feriadosResult, gymPriceResult, promocionesResult, descuentosResult] = await Promise.all([
    getFeriados(),
    getGymPrice(),
    getPromociones(),
    getDescuentos(),
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center">
      <main className="w-full max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="p-2 hover:bg-[var(--button-secondary-bg)] rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <House className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Información</h1>
          <div className="w-9" />
        </div>

        <div className="grid gap-6">
          {/* Price Section */}
          <PriceSection price={gymPriceResult.data} priceError={gymPriceResult.error} />

          {/* Hours Section */}
          <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Horarios</h2>
            <p className="text-lg text-[var(--foreground)]">8:00 a 22:00</p>
            <p className="text-[var(--muted-foreground)] mt-1">Lunes a viernes</p>
          </section>

          {/* Address Section */}
          <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Dirección</h2>
            <p className="text-lg text-[var(--foreground)]">Sargento Cabral 545</p>
            <p className="text-[var(--muted-foreground)] mt-1">Esquina Corrientes</p>
            <a
              href="https://maps.app.goo.gl/oxcpqAWFmFKpfpMU9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-3 py-1.5 text-sm bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] rounded-lg transition-colors"
            >
              Ver en Google Maps
            </a>
          </section>

          {/* Holidays Section */}
          <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Feriados</h2>
              <Link
                href="/feriados"
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Ver todos →
              </Link>
            </div>
            <Suspense fallback={<HolidaysSkeleton />}>
              <HolidaysPreview feriados={feriadosResult.data} feriadosError={feriadosResult.error} />
            </Suspense>
          </section>

          {/* Promociones Section */}
          <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-[var(--foreground)]" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Promociones</h2>
            </div>
            <PromocionesPreview promociones={promocionesResult.data} error={promocionesResult.error} />
          </section>

          {/* Descuentos Section */}
          <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Percent className="w-5 h-5 text-[var(--foreground)]" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Descuentos por Duración</h2>
            </div>
            <DescuentosPreview descuentos={descuentosResult.data} error={descuentosResult.error} />
          </section>
        </div>
      </main>
    </div>
  );
}

function HolidaysPreview({
  feriados,
  feriadosError,
}: {
  feriados: Feriado[];
  feriadosError: boolean;
}) {
  // Error state - don't render holidays
  if (feriadosError) {
    return (
      <p className="text-[var(--muted-foreground)]">No se pudieron cargar los feriados</p>
    );
  }

  // Empty state
  if (feriados.length === 0) {
    return (
      <p className="text-[var(--muted-foreground)]">No hay feriados programados</p>
    );
  }

  // Filter to only show today and future holidays
  const today = getToday();
  const feriadosVisibles = feriados.filter((f) => f.fecha >= today);

  if (feriadosVisibles.length === 0) {
    return (
      <p className="text-[var(--muted-foreground)]">No hay feriados programados</p>
    );
  }

  return (
    <ul className="space-y-2">
      {feriadosVisibles.slice(0, 3).map((feriado) => (
        <li key={feriado.id} className="text-[var(--foreground)]">
          <span>{formatDate(feriado.fecha)}</span>
          <span className="text-[var(--muted-foreground)] text-sm ml-2">
            — {formatFeriadoDisplay(feriado)}
          </span>
        </li>
      ))}
      {feriadosVisibles.length > 3 && (
        <li className="text-[var(--muted-foreground)] text-sm">
          +{feriadosVisibles.length - 3} más...
        </li>
      )}
    </ul>
  );
}

function HolidaysSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-5 w-32 bg-[var(--background)] rounded animate-pulse" />
      <div className="h-5 w-40 bg-[var(--background)] rounded animate-pulse" />
    </div>
  );
}

function PriceSection({
  price,
  priceError,
}: {
  price: number | null;
  priceError: boolean;
}) {
  // Error state - communicate absence, don't fake data
  if (priceError || price === null) {
    return (
      <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
          Precio
        </h2>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-muted-foreground">
            No disponible
          </p>
          <AlertCircle className="w-4 h-4 text-destructive" />
        </div>
        <p className="text-[var(--muted-foreground)] mt-1 text-sm">Precio no disponible</p>
      </section>
    );
  }

  return (
    <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
        Precio
      </h2>
      <p className="text-2xl font-bold text-[var(--foreground)]">
        {formatPrice(price)}
      </p>
      <p className="text-[var(--muted-foreground)] mt-1">Abono mensual</p>
    </section>
  );
}

function PriceSectionSkeleton() {
  return (
    <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
        Precio
      </h2>
      <div className="h-8 w-28 bg-[var(--background)] rounded animate-pulse" />
    </section>
  );
}

function PromocionesPreview({
  promociones,
  error,
}: {
  promociones: Promocion[];
  error: boolean;
}) {
  if (error) {
    return (
      <p className="text-[var(--muted-foreground)]">No se pudieron cargar las promociones</p>
    );
  }

  if (promociones.length === 0) {
    return (
      <p className="text-[var(--muted-foreground)]">No hay promociones activas</p>
    );
  }

  return (
    <div className="grid gap-4">
      {promociones.map((promocion) => (
        <Card
          key={promocion.id}
          className="bg-[var(--background)] border-[var(--card-border)]"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[var(--foreground)]">
              {promocion.titulo}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)] mb-2">
              {promocion.descripcion}
            </p>
            <p className="text-lg font-bold text-[var(--foreground)]">
              {promocion.precio}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DescuentosPreview({
  descuentos,
  error,
}: {
  descuentos: DescuentoDuracion[];
  error: boolean;
}) {
  if (error) {
    return (
      <p className="text-[var(--muted-foreground)]">No se pudieron cargar los descuentos</p>
    );
  }

  if (descuentos.length === 0) {
    return (
      <p className="text-[var(--muted-foreground)]">No hay descuentos disponibles</p>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--card-border)] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[var(--background)] hover:bg-[var(--background)]">
            <TableHead className="text-[var(--foreground)] font-medium">Duración</TableHead>
            <TableHead className="text-[var(--foreground)] font-medium text-right">Descuento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {descuentos.map((descuento) => (
            <TableRow key={descuento.id} className="hover:bg-[var(--button-secondary-bg)]">
              <TableCell className="text-[var(--foreground)]">
                {descuento.meses} {descuento.meses === 1 ? "mes" : "meses"}
              </TableCell>
              <TableCell className="text-right font-semibold text-[var(--foreground)]">
                {descuento.porcentaje}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
