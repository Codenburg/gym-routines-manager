"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Instagram, MapPin, MessageCircle, type LucideIcon } from "lucide-react";
import { updateGymField } from "@/app/actions/gym";
import { DumbbellSpinner } from "@/components/ui/dumbbell-spinner";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { WeeklyScheduleEditor } from "@/components/admin/WeeklyScheduleEditor";
import type { FormState, GymDisplay, GymField } from "@/lib/schemas";

/**
 * Per-field FormState — paired with `updateGymField`.
 * `data` carries the saved `{ field, value }` so the manager can resync
 * the input when the action completes.
 */
type FieldFormState = FormState<{ field: GymField; value: string }>;

interface GymConfigManagerProps {
  initial: GymDisplay;
}

/**
 * Admin-only form manager for the singleton Gym record.
 *
 * Phase 3 of the gym-config-admin change. Each sub-form is a thin
 * configuration object passed to `<FieldSubForm>` — the hook + shell
 * are shared, the per-field UI is a single `input`/`textarea` element.
 *
 * The `horarioJson` sub-form is a special case: it is a composite
 * editor (7 day cards with switches + time pickers) that bypasses the
 * single-input `FieldConfig` shell and renders `<WeeklyScheduleEditor>`
 * directly. All other sub-forms post to the same `updateGymField`
 * server action; the `field` hidden input discriminates which Gym
 * column is written.
 *
 * The action returns the saved `{ field, value }` in `state.data`,
 * which the input uses as `defaultValue` with a `key` so it resyncs
 * after a save without a controlled/uncontrolled dance.
 */
export function GymConfigManager({ initial }: GymConfigManagerProps) {
  return (
    <div className="space-y-6">
      <FieldSubForm config={IDENTITY_CONFIG} initialValue={initial.nombre} />
      <WeeklyScheduleEditor initial={initial.horarioJson} />
      <FieldSubForm config={DIRECCION_CONFIG} initialValue={initial.direccion} />
      <FieldSubForm
        config={MAPS_EMBED_URL_CONFIG}
        initialValue={initial.mapsEmbedUrl}
      />
      <FieldSubForm
        config={SOCIAL_INSTAGRAM_CONFIG}
        initialValue={initial.socialInstagram}
      />
      <FieldSubForm
        config={SOCIAL_WHATSAPP_CONFIG}
        initialValue={initial.socialWhatsapp}
      />
    </div>
  );
}

// ============================================================
// Field config — declarative description of each editable field.
// New fields are a single config object + an entry in GymConfigManager.
// ============================================================

interface FieldConfig {
  /** Discriminant sent to `updateGymField` (matches GymField). */
  field: GymField;
  /** Section card title. */
  title: string;
  /** Section card description. */
  description: string;
  /** Lucide icon shown in the card header. */
  icon: LucideIcon;
  /** Label of the visible input. */
  inputLabel: string;
  /** Text input vs textarea (longer free-text values). */
  inputKind: "text" | "textarea" | "url";
  /** Max length forwarded to the input. */
  maxLength: number;
  /** Placeholder for the input. */
  placeholder: string;
  /** Submit button text. */
  saveLabel: string;
  /** Optional section header rendered ABOVE the card (for grouped fields). */
  sectionHeader?: { icon: LucideIcon; title: string; description: string };
}

const IDENTITY_CONFIG: FieldConfig = {
  field: "nombre",
  title: "Identidad",
  description: "Nombre visible del gimnasio.",
  icon: Building2,
  inputLabel: "Nombre del gimnasio",
  inputKind: "text",
  maxLength: 80,
  placeholder: "Ej: Gimnasio Norte",
  saveLabel: "Guardar nombre",
};

const DIRECCION_CONFIG: FieldConfig = {
  field: "direccion",
  title: "Dirección",
  description: "Calle, número, ciudad.",
  icon: MapPin,
  inputLabel: "Dirección",
  inputKind: "text",
  maxLength: 200,
  placeholder: "Ej: Av. Siempre Viva 742, CABA",
  saveLabel: "Guardar dirección",
};

const MAPS_EMBED_URL_CONFIG: FieldConfig = {
  field: "mapsEmbedUrl",
  title: "Mapa (Google Maps embed)",
  description:
    "URL completa del <iframe> de Google Maps (Compartir > Insertar mapa).",
  icon: MapPin,
  inputLabel: "URL del embed de mapa",
  inputKind: "url",
  maxLength: 2000,
  placeholder: "https://www.google.com/maps/embed?pb=...",
  saveLabel: "Guardar mapa",
  sectionHeader: {
    icon: MapPin,
    title: "Ubicación",
    description:
      "Dirección y enlace de Google Maps. Cada campo se guarda por separado.",
  },
};

/**
 * Shared section header for the Social sub-forms. Instagram is the
 * first social sub-form so it carries the sectionHeader; WhatsApp
 * just renders its own card (no sectionHeader in its config).
 */
const SOCIAL_SECTION_HEADER: NonNullable<FieldConfig["sectionHeader"]> = {
  icon: MessageCircle,
  title: "Redes",
  description:
    "Enlaces a Instagram y WhatsApp. Cada campo se guarda por separado.",
};

const SOCIAL_INSTAGRAM_CONFIG: FieldConfig = {
  field: "socialInstagram",
  title: "Instagram",
  description: "URL completa del perfil o publicación.",
  icon: Instagram,
  inputLabel: "URL de Instagram",
  inputKind: "url",
  maxLength: 500,
  placeholder: "https://www.instagram.com/tu_gimnasio",
  saveLabel: "Guardar Instagram",
  sectionHeader: SOCIAL_SECTION_HEADER,
};

const SOCIAL_WHATSAPP_CONFIG: FieldConfig = {
  field: "socialWhatsapp",
  title: "WhatsApp",
  description: "URL de wa.me o enlace directo al chat.",
  icon: MessageCircle,
  inputLabel: "URL de WhatsApp",
  inputKind: "url",
  maxLength: 500,
  placeholder: "https://wa.me/5491112345678",
  saveLabel: "Guardar WhatsApp",
};

// ============================================================
// Hook — wires useActionState to updateGymField and derives
// server-resynced value + field error from the action state.
// ============================================================

interface UseGymFieldFormResult {
  state: FieldFormState;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  displayedValue: string;
  fieldError: string | null;
  generalError: string | null;
}

function useGymFieldForm(field: GymField, initialValue: string | null): UseGymFieldFormResult {
  const [state, formAction, isPending] = useActionState<FieldFormState, FormData>(
    updateGymField,
    { success: false, errors: undefined, message: undefined }
  );

  // Server-returned value wins on success — the input resyncs
  // even after edits in another tab.
  const displayedValue =
    state.success && state.data?.field === field
      ? state.data.value
      : initialValue ?? "";

  const fieldError = state.errors?.[field]?.[0] ?? null;
  const generalError =
    !fieldError && !state.success ? state.message ?? null : null;

  return { state, formAction, isPending, displayedValue, fieldError, generalError };
}

// ============================================================
// Sub-form shell + input primitives
// ============================================================

const INPUT_CLASS =
  "w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring disabled:opacity-50";

interface FieldSubFormProps {
  config: FieldConfig;
  initialValue: string | null;
}

/**
 * Generic sub-form for any single Gym display field. Renders the
 * section header (if grouped), the AdminCard with icon/title/description,
 * the input, and the submit button. Wires its own useGymFieldForm hook
 * and triggers a sonner success toast + router.refresh on save.
 */
function FieldSubForm({ config, initialValue }: FieldSubFormProps) {
  const { state, formAction, isPending, displayedValue, fieldError, generalError } =
    useGymFieldForm(config.field, initialValue);

  const router = useRouter();

  // The server action already calls revalidatePath('/admin') and
  // revalidateTag('gym-config') — but in the SAME session, those
  // invalidations do not auto-re-render the current page. router.refresh()
  // forces a fresh RSC render of the surrounding /admin layout (sidebar,
  // etc.) so the saved value is visible across the panel immediately,
  // matching the project pattern in ejercicio-list.tsx.
  useEffect(() => {
    if (!isPending && state.success) {
      toast.success("Configuración actualizada");
      router.refresh();
    }
  }, [isPending, state.success, router]);

  const Icon = config.icon;
  const input = (
    <AdminFormField
      variant="default"
      label={config.inputLabel}
      error={fieldError ?? undefined}
    >
      {renderInput(config, displayedValue, isPending)}
    </AdminFormField>
  );

  return (
    <>
      {config.sectionHeader && <SectionHeader config={config.sectionHeader} />}
      <AdminCard variant="standard">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="field" value={config.field} />
          {input}

          {generalError && (
            <p className="text-destructive text-sm" role="alert">
              {generalError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <DumbbellSpinner size={16} />
                  Guardando...
                </>
              ) : (
                config.saveLabel
              )}
            </button>
          </div>
        </form>
      </AdminCard>
    </>
  );
}

function renderInput(config: FieldConfig, displayedValue: string, isPending: boolean): ReactNode {
  const common = {
    name: "value",
    defaultValue: displayedValue,
    // Re-mount when server value changes so the input resyncs
    // (controlled vs uncontrolled dance avoided).
    key: displayedValue,
    maxLength: config.maxLength,
    disabled: isPending,
    placeholder: config.placeholder,
    className: INPUT_CLASS,
  } as const;

  if (config.inputKind === "textarea") {
    return <textarea {...common} rows={3} className={`${INPUT_CLASS} resize-y`} />;
  }
  if (config.inputKind === "url") {
    return <input type="url" {...common} />;
  }
  return <input type="text" {...common} />;
}

function SectionHeader({
  config,
}: {
  config: NonNullable<FieldConfig["sectionHeader"]>;
}) {
  const Icon = config.icon;
  return (
    <div className="px-1">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        {config.title}
      </h3>
      <p className="text-sm text-muted-foreground">{config.description}</p>
    </div>
  );
}
