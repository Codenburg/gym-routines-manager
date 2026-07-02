import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, isAdmin } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "../../../../generated/client";
import {
  horarioSemanalSchema,
  type HorarioSemanal,
} from "@/lib/schemas";

/**
 * Gym singleton response
 *
 * `horarioJson` is a structured `HorarioSemanal` object (or `null` when
 * unconfigured). The Zod schema narrows the DB value at the read boundary
 * so a corrupt or legacy row is never propagated as unvalidated data.
 */
interface GymResponse {
  id: string;
  price: number;
  // Display fields — all nullable until an admin configures them.
  nombre: string | null;
  horarioJson: HorarioSemanal | null;
  direccion: string | null;
  mapsEmbedUrl: string | null;
  socialInstagram: string | null;
  socialWhatsapp: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Schema for updating the gym singleton via the REST endpoint.
 *
 * Accepts any subset of price + the 5 string display fields + the
 * structured `horarioJson`. At least one field MUST be present. URL
 * fields use z.string().url(); nombre is required non-empty when
 * present; direccion is free-text (bounded length). horarioJson
 * accepts the full `HorarioSemanal` object or `null` (which clears
 * the schedule).
 *
 * Note: this REST PATCH exists for symmetry with the GET endpoint
 * and for any external tooling. The recommended write path for the
 * admin UI is the `updateGymField` server action in
 * src/app/actions/gym.ts (per-field, tagged revalidation).
 */
const gymUpdateSchema = z
  .object({
    price: z.number().positive({ message: "El precio debe ser un número positivo" }).optional(),
    nombre: z
      .string()
      .trim()
      .min(1, { message: "El nombre no puede estar vacío" })
      .max(80, { message: "El nombre no puede superar 80 caracteres" })
      .optional(),
    horarioJson: horarioSemanalSchema.nullable().optional(),
    direccion: z
      .string()
      .trim()
      .min(1, { message: "La dirección no puede estar vacía" })
      .max(200, { message: "La dirección no puede superar 200 caracteres" })
      .optional(),
    mapsEmbedUrl: z
      .string()
      .trim()
      .url({ message: "URL de mapa inválida" })
      .max(2000, { message: "La URL de mapa es demasiado larga" })
      .optional(),
    socialInstagram: z
      .string()
      .trim()
      .url({ message: "URL de Instagram inválida" })
      .max(500, { message: "La URL de Instagram es demasiado larga" })
      .optional(),
    socialWhatsapp: z
      .string()
      .trim()
      .url({ message: "URL de WhatsApp inválida" })
      .max(500, { message: "La URL de WhatsApp es demasiado larga" })
      .optional(),
  })
  .refine(
    (data) =>
      data.price !== undefined ||
      data.nombre !== undefined ||
      data.horarioJson !== undefined ||
      data.direccion !== undefined ||
      data.mapsEmbedUrl !== undefined ||
      data.socialInstagram !== undefined ||
      data.socialWhatsapp !== undefined,
    { message: "Se requiere al menos un campo para actualizar" }
  );

/**
 * Helper function to verify admin access
 */
async function verifyAdmin(
  headers: Headers
): Promise<{ authorized: boolean; activeOrganizationId?: string; message?: string }> {
  try {
    const session = await auth.api.getSession({ headers });
    if (!session) {
      return { authorized: false, message: "Debes iniciar sesión" };
    }
    if (!(await isAdmin(headers))) {
      return { authorized: false, message: "No tienes permisos de administrador" };
    }
    const activeOrganizationId = session.session.activeOrganizationId;
    if (!activeOrganizationId) {
      return { authorized: false, message: "No hay organización activa" };
    }
    return { authorized: true, activeOrganizationId };
  } catch {
    return { authorized: false, message: "Error de autenticación" };
  }
}

/**
 * GET /api/gym
 * Returns the active tenant gym configuration for admins only.
 *
 * Response 200:
 * - Gym object with id, price, the 5 string display fields (any may be
 *   null), the structured `horarioJson` (object | null, Zod-narrowed at
 *   the read boundary), and createdAt/updatedAt.
 *
 * Response 500:
 * - Error message indicating service unavailability
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authCheck = await verifyAdmin(request.headers);
  if (!authCheck.authorized) {
    const status = authCheck.message === "Debes iniciar sesión" ? 401 : 403;
    return NextResponse.json({ error: authCheck.message }, { status });
  }
  const organizationId = authCheck.activeOrganizationId;
  if (!organizationId) {
    return NextResponse.json({ error: "No hay organización activa" }, { status: 403 });
  }

  try {
    const gym = await prisma.gym.findUnique({
      where: { id: organizationId },
    });

    if (!gym) {
      return NextResponse.json(
        { error: "Configuración del gym no encontrada" },
        { status: 404 }
      );
    }

    // Zod-narrow the horarioJson column at the read boundary. If the DB
    // value is corrupt (legacy shape, manual edit, partial migration) we
    // return null instead of propagating unvalidated data to clients.
    const horarioJsonParsed = horarioSemanalSchema.safeParse(gym.horarioJson);
    const horarioJson: HorarioSemanal | null = horarioJsonParsed.success
      ? horarioJsonParsed.data
      : null;

    // Convert Decimal to number for JSON response
    const response: GymResponse = {
      id: gym.id,
      price: Number(gym.price),
      nombre: gym.nombre ?? null,
      horarioJson,
      direccion: gym.direccion ?? null,
      mapsEmbedUrl: gym.mapsEmbedUrl ?? null,
      socialInstagram: gym.socialInstagram ?? null,
      socialWhatsapp: gym.socialWhatsapp ?? null,
      createdAt: gym.createdAt.toISOString(),
      updatedAt: gym.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch gym config:", error);

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/gym
 * Updates the active tenant gym configuration (admin only)
 *
 * Request Body (at least one field required):
 * - price: number (optional, positive)
 * - nombre: string (optional, 1-80 chars)
 * - horarioJson: HorarioSemanal | null (optional, structured weekly schedule)
 * - direccion: string (optional, 1-200 chars)
 * - mapsEmbedUrl: string (optional, valid URL, <=2000 chars)
 * - socialInstagram: string (optional, valid URL, <=500 chars)
 * - socialWhatsapp: string (optional, valid URL, <=500 chars)
 *
 * Response 200:
 * - Updated Gym object (full shape, matches GET)
 *
 * Response 400:
 * - Validation error
 *
 * Response 401:
 * - Unauthorized (not logged in)
 *
 * Response 403:
 * - Forbidden (not admin)
 *
 * Response 404:
 * - Gym configuration not found
 *
 * Response 500:
 * - Error message indicating service unavailability
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  // Verify admin access
  const authCheck = await verifyAdmin(request.headers);
  if (!authCheck.authorized) {
    const status = authCheck.message === "Debes iniciar sesión" ? 401 : 403;
    return NextResponse.json({ error: authCheck.message }, { status });
  }
  const organizationId = authCheck.activeOrganizationId;
  if (!organizationId) {
    return NextResponse.json({ error: "No hay organización activa" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = gymUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: z.flattenError(parsed.error).fieldErrors },
        { status: 400 }
      );
    }

    // Check if gym exists
    const existing = await prisma.gym.findUnique({
      where: { id: organizationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Configuración del gym no encontrada" },
        { status: 404 }
      );
    }

    // When horarioJson is null in the payload, persist SQL NULL so the
    // read boundary returns null and the public HoursSection hides itself.
    // Prisma 7 requires explicit NullableJsonNullValueInput for null on
    // a Json? column. We forward the parsed value directly otherwise.
    const updateData: Record<string, unknown> = { ...parsed.data };
    if (Object.prototype.hasOwnProperty.call(parsed.data, "horarioJson") &&
        parsed.data.horarioJson === null) {
      updateData.horarioJson = Prisma.JsonNull;
    }

    const gym = await prisma.gym.update({
      where: { id: organizationId },
      data: updateData,
    });

    // Revalidate admin surfaces that display gym config. Canonical public
    // tenant paths are under `/g/[orgSlug]/*` and are handled by cache tags
    // in the server-action write path until slice 2 owns write-path cleanup.
    revalidatePath("/admin");
    revalidatePath("/api/gym");
    revalidateTag("gym-config", "max");
    revalidateTag(`gym:${organizationId}:config`, "max");

    // Zod-narrow the freshly-persisted value to be consistent with GET.
    const horarioJsonParsed = horarioSemanalSchema.safeParse(gym.horarioJson);
    const horarioJson: HorarioSemanal | null = horarioJsonParsed.success
      ? horarioJsonParsed.data
      : null;

    const response: GymResponse = {
      id: gym.id,
      price: Number(gym.price),
      nombre: gym.nombre ?? null,
      horarioJson,
      direccion: gym.direccion ?? null,
      mapsEmbedUrl: gym.mapsEmbedUrl ?? null,
      socialInstagram: gym.socialInstagram ?? null,
      socialWhatsapp: gym.socialWhatsapp ?? null,
      createdAt: gym.createdAt.toISOString(),
      updatedAt: gym.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update gym config:", error);

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
