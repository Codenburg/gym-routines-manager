"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { showSuccess, showError } from "@/lib/toast";
import {
  Building2,
  Camera,
  MapPin,
  MessageCircle,
  Trash2,
  type LucideIcon,
} from "lucide-react";
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
 *
 * `value` is `unknown` (not `string`) because the same `updateGymField`
 * action is shared with the structured `horarioJson` variant (whose
 * value is a `HorarioSemanal` object). `useGymFieldForm` is only used
 * by the 5 string sub-forms — it casts the value to `string` when
 * reading it for `displayedValue`.
 */
type FieldFormState = FormState<{ field: GymField; value: unknown }>;

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
  /**
   * When true, the input is rendered as a controlled component and the
   * submit button is disabled while the value is empty. Used for fields
   * where empty is not a valid persisted state (e.g. gym name).
   */
  requiredValue?: boolean;
  /**
   * When `true`, the sub-form renders a "Vaciar" (Trash2) button next
   * to "Guardar". Clicking it calls `clearGymDisplayField` and shows a
   * 5s undoable toast with a progress bar.
   *
   * Defaults to `false` (literal-union per design D7 — forces explicit
   * opt-in, prevents accidental clear on `nombre` / `horarioJson`).
   * Only the 4 nullable display fields (`direccion`, `mapsEmbedUrl`,
   * `socialInstagram`, `socialWhatsapp`) set this to `true`.
   */
  clearable?: false | true;
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
  requiredValue: true,
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
  icon: Camera,
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

/**
 * Module-level type guard. The `updateGymField` server action returns
 * `value: unknown` so the same action can carry both the string variants
 * (nombre, direccion, mapsEmbedUrl, socialInstagram, socialWhatsapp) and
 * the structured `horarioJson` variant (which is a `HorarioSemanal`).
 * The callers below narrow with a discriminant check on `field`, then
 * use this guard to assert the runtime shape. Without it, every call
 * site would need a TypeScript-lying `as string` cast.
 */
function isStringValue(v: unknown): v is string {
  return typeof v === "string";
}

function useGymFieldForm(field: GymField, initialValue: string | null): UseGymFieldFormResult {
  const [state, formAction, isPending] = useActionState<FieldFormState, FormData>(
    updateGymField,
    { success: false, errors: undefined, message: undefined }
  );

  // Server-returned value wins on success — the input resyncs
  // even after edits in another tab. The discriminant on `field` plus
  // the `isStringValue` runtime guard narrow the `unknown` payload to
  // `string` without a `as` cast at the call site.
  const displayedValue =
    state.success && state.data?.field === field && isStringValue(state.data.value)
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
  const wasPendingRef = useRef(false);

  // For fields that require a non-empty value (currently: nombre), mirror
  // the input in local state so the submit button can be disabled while
  // the field is blank. The server-returned value still wins on a
  // successful save — the useEffect below resyncs after each save.
  // Same `useState` + sync pattern as WeeklyScheduleEditor.
  const isRequired = !!config.requiredValue;
  const [controlledValue, setControlledValue] = useState<string>(displayedValue);
  useEffect(() => {
    if (
      state.success &&
      state.data?.field === config.field &&
      isStringValue(state.data.value)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setControlledValue(state.data.value);
    }
  }, [state, config.field]);

  const isValueEmpty = isRequired && controlledValue.trim() === "";
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setControlledValue(e.target.value);
  };

  // Vaciar button state — uses its own useTransition (independent of
  // the Guardar useActionState pending flag). D1: the button is
  // type="button" + onClick + useTransition, lives INSIDE the same
  // <form> for layout but does NOT submit it. D9: `isBusy` merges
  // both pending flags so the input + Guardar + Vaciar all disable
  // together while ANY action is in-flight.
  const [isClearPending, startClearTransition] = useTransition();
  const isBusy = isPending || isClearPending;
  const isClearableEmpty =
    !config.clearable || (displayedValue ?? "").trim() === "";

  // Per-field testid (design decision #1):
  //   mapsEmbedUrl → clear-mapa
  //   socialInstagram → clear-instagram
  //   socialWhatsapp → clear-whatsapp
  //   direccion → clear-direccion
  const clearTestId =
    config.field === "mapsEmbedUrl"
      ? "clear-mapa"
      : config.field === "socialInstagram"
        ? "clear-instagram"
        : config.field === "socialWhatsapp"
          ? "clear-whatsapp"
          : `clear-${config.field}`;

  // Only fire the toast on the pending → done transition. The previous
  // pattern (chequear `state.success` en cada render) leaked toasts across
  // router.refresh / re-mount / cache revalidation — every sub-form that
  // had `state.success` lingering from a prior save would toast again on
  // re-hydration. There are 5 of these in the same tree, hence the
  // "se guardó todo de nuevo" feeling on navigation.
  useEffect(() => {
    if (wasPendingRef.current && !isPending) {
      if (state.success) {
        showSuccess("Configuración actualizada");
        router.refresh();
      } else if (state.message) {
        showError(state.message);
      }
    }
    wasPendingRef.current = isPending;
    // Explicit deps: the effect only reads `state.success` / `state.message`,
    // not the full state object. Listing the exact fields we read makes the
    // intent clearer and avoids re-runs on unrelated state-shape changes.
  }, [isPending, state.success, state.message, router]);

  const Icon = config.icon;
  const input = (
    <AdminFormField
      variant="default"
      label={config.inputLabel}
      error={fieldError ?? undefined}
    >
      {renderInput(
        config,
        displayedValue,
        isBusy,
        isRequired ? controlledValue : undefined,
        isRequired ? onInputChange : undefined,
      )}
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

          <div className="flex justify-end items-center gap-2">
            {config.clearable && (
              <button
                type="button"
                onClick={() => {
                  // T-011 wires the actual handleClear flow. For T-009
                  // (button shell), this is a no-op — clicking does
                  // nothing until T-011 adds the action.
                  startClearTransition(() => {});
                }}
                disabled={isBusy || isClearableEmpty}
                title="Vaciar campo"
                data-testid={clearTestId}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted-foreground p-2 rounded transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isBusy || isValueEmpty}
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

function renderInput(
  config: FieldConfig,
  displayedValue: string,
  isPending: boolean,
  controlledValue?: string,
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
): ReactNode {
  // For required fields the input is controlled (so the submit button
  // can react to the current value). For the rest it stays uncontrolled
  // with the original `key={displayedValue}` re-mount pattern.
  //
  // NOTE: `key` MUST be passed directly to JSX, not via spread.
  // React 19+ throws a console error if `key` is in a spread object.
  const isControlled = controlledValue !== undefined && onChange !== undefined;
  const common = {
    name: "value",
    ...(isControlled
      ? { value: controlledValue, onChange }
      : { defaultValue: displayedValue }),
    maxLength: config.maxLength,
    disabled: isPending,
    placeholder: config.placeholder,
    className: INPUT_CLASS,
  } as const;

  if (config.inputKind === "textarea") {
    return isControlled
      ? <textarea {...common} rows={3} className={`${INPUT_CLASS} resize-y`} />
      : <textarea key={displayedValue} {...common} rows={3} className={`${INPUT_CLASS} resize-y`} />;
  }
  if (config.inputKind === "url") {
    return isControlled
      ? <input {...common} type="url" />
      : <input key={displayedValue} {...common} type="url" />;
  }
  return isControlled
    ? <input {...common} type="text" />
    : <input key={displayedValue} {...common} type="text" />;
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
