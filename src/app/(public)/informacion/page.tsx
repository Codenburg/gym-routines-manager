import Link from "next/link"
import { House } from "lucide-react"
import { DataResult, ok, err } from "@/lib/data-result"
import { PriceSection } from "@/components/informacion/PriceSection"
import { CollapsibleSection } from "@/components/informacion/CollapsibleSection"
import { PlansSection } from "@/components/informacion/PlansSection"
import { DurationDiscountsSection } from "@/components/informacion/DurationDiscountsSection"
import { HoursSection } from "@/components/informacion/HoursSection"
import { AddressSection } from "@/components/informacion/AddressSection"
import { SocialLinksSection } from "@/components/informacion/SocialLinksSection"
import { getGymDisplayForServer } from "@/app/actions/gym"
import type { HorarioSemanal } from "@/lib/schemas"

interface Feriado {
  id: string
  fecha: string
  todo_dia: boolean
  hora_inicio: string | null
  hora_fin: string | null
  createdAt: string
}

interface GymConfig {
  id: string
  price: number
  createdAt: string
  updatedAt: string
}

export interface Promocion {
  id: string
  titulo: string
  descripcion: string
  precio: string
  activo: boolean
  createdAt: string
}

export interface DescuentoDuracion {
  id: number
  meses: number
  porcentaje: number
}

async function getFeriados(): Promise<DataResult<Feriado[]>> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  try {
    const response = await fetch(`${baseUrl}/api/feriados`, {
      cache: "no-store",
    })
    if (!response.ok) return err([])
    return ok(await response.json())
  } catch {
    return err([])
  }
}

async function getGymPrice(): Promise<DataResult<number | null>> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  try {
    const response = await fetch(`${baseUrl}/api/gym`, {
      cache: "no-store",
    })
    if (!response.ok) return err(null)
    const gym: GymConfig = await response.json()
    return ok(gym.price)
  } catch {
    return err(null)
  }
}

async function getPromociones(): Promise<DataResult<Promocion[]>> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  try {
    const response = await fetch(`${baseUrl}/api/promociones`, {
      cache: "no-store",
    })
    if (!response.ok) return err([])
    const data = await response.json()
    return ok(data.promociones)
  } catch {
    return err([])
  }
}

async function getDescuentos(): Promise<DataResult<DescuentoDuracion[]>> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  try {
    const response = await fetch(`${baseUrl}/api/descuentos-duracion`, {
      cache: "no-store",
    })
    if (!response.ok) return err([])
    const data = await response.json()
    return ok(data.descuentos)
  } catch {
    return err([])
  }
}

/**
 * Read the gym display fields (horarioJson / direccion / mapsEmbedUrl /
 * socialInstagram / socialWhatsapp) via the cached server reader.
 * Returns `null` for any field the admin has not set — section
 * components decide whether to render or hide based on these values.
 *
 * On error, returns an object with all-null fields so the page keeps
 * rendering the other sections (price, promotions, discounts) instead
 * of failing the whole page.
 */
async function getGymDisplay(): Promise<DataResult<{
  horarioJson: HorarioSemanal | null
  direccion: string | null
  mapsEmbedUrl: string | null
  socialInstagram: string | null
  socialWhatsapp: string | null
}>> {
  try {
    const gym = await getGymDisplayForServer()
    return ok({
      horarioJson: gym?.horarioJson ?? null,
      direccion: gym?.direccion ?? null,
      mapsEmbedUrl: gym?.mapsEmbedUrl ?? null,
      socialInstagram: gym?.socialInstagram ?? null,
      socialWhatsapp: gym?.socialWhatsapp ?? null,
    })
  } catch {
    return err({
      horarioJson: null,
      direccion: null,
      mapsEmbedUrl: null,
      socialInstagram: null,
      socialWhatsapp: null,
    })
  }
}

export default async function InformacionPage() {
  const [feriadosResult, gymPriceResult, promocionesResult, descuentosResult, gymDisplayResult] =
    await Promise.all([
      getFeriados(),
      getGymPrice(),
      getPromociones(),
      getDescuentos(),
      // Read the gym display fields (horario / direccion / mapsEmbedUrl /
      // socialInstagram / socialWhatsapp) via the cached server reader.
      // Wrapped in a try/catch inside the helper so a DB outage
      // resolves to all-null — sections render nothing instead of
      // falling back to hardcoded values.
      getGymDisplay(),
    ])

  const display = gymDisplayResult.data

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
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
            Información
          </h1>
          <div className="w-9" />
        </div>

        <div className="grid gap-6">
          <PriceSection
            price={gymPriceResult.data}
            error={gymPriceResult.error}
          />

          {/* Plans / Promociones — collapsible */}
          <CollapsibleSection title="Promociones">
            <PlansSection
              promociones={promocionesResult.data}
              error={promocionesResult.error}
            />
          </CollapsibleSection>

          {/* Descuentos — collapsible */}
          <CollapsibleSection title="Descuentos">
            <DurationDiscountsSection
              descuentos={descuentosResult.data}
              error={descuentosResult.error}
            />
          </CollapsibleSection>

          <HoursSection horario={display?.horarioJson ?? null} />
          <AddressSection
            direccion={display?.direccion ?? null}
            mapsEmbedUrl={display?.mapsEmbedUrl ?? null}
          />
          <SocialLinksSection
            socialInstagram={display?.socialInstagram ?? null}
            socialWhatsapp={display?.socialWhatsapp ?? null}
          />
        </div>
      </main>
    </div>
  )
}