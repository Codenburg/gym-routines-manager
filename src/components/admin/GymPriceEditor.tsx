"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateGymPrice } from "@/app/actions/gym";
import { DumbbellSpinner } from "@/components/ui/dumbbell-spinner";

interface GymPriceEditorProps {
  initialPrice: number | null;
}

export function GymPriceEditor({ initialPrice }: GymPriceEditorProps) {
  // Initial state for useActionState
  const initialState = {
    success: false,
    data: initialPrice !== null ? { price: initialPrice } : undefined,
  };

  // useActionState manages server state
  const [state, formAction, isPending] = useActionState(
    updateGymPrice,
    initialState
  );

  // isEditing is LOCAL UI state - independent of server state
  const [isEditing, setIsEditing] = useState(false);

  // Server state tells us what price to display
  const serverPrice = state.data?.price ?? initialPrice;

  // When a submission finishes AND was successful, close edit mode and show toast
  // Using isPending in deps because it transitions true->false on completion
  useEffect(() => {
    if (!isPending && state.success) {
      setIsEditing(false);
      toast.success("Precio actualizado exitosamente");
    }
  }, [isPending, state.success]);

  // showEditForm: show form when user is editing (regardless of state.success)
  // This fixes the bug where state.success=true blocked re-entering edit mode
  const showEditForm = isEditing;

  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  // Error message: field errors take priority, then general message
  const serverError =
    state.errors?.price?.[0] ||
    (state.message && !state.success ? state.message : null);

  // Display mode: show price with edit button
  if (!showEditForm && serverPrice !== null) {
    return (
      <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-4">
          Precio
        </h2>
        <div className="flex items-center gap-4">
          <p className="text-3xl font-bold text-[var(--foreground)]">
            {formatPrice(serverPrice)}
          </p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-sm bg-[var(--button-primary-bg)] hover:opacity-90 text-[var(--button-primary-foreground)] rounded-lg transition-colors"
          >
            Editar precio
          </button>
        </div>
        <p className="text-[var(--muted-foreground)] mt-2">Abono mensual</p>
      </div>
    );
  }

  // Editing mode: show input form
  // Use action={formAction} directly - this is the React 19 way
  return (
    <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-4">
        Precio
      </h2>
      <form action={formAction}>
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                $
              </span>
              <input
                type="number"
                name="price"
                defaultValue={serverPrice ?? ""}
                onKeyDown={handleKeyDown}
                disabled={isPending}
                autoFocus
                // Rule: defaultValue sin key está prohibido — key fuerza reinicialización cuando serverPrice cambia
                key={serverPrice}
                className="w-full pl-7 pr-4 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
                placeholder="45000"
                min="0"
                step="100"
              />
            </div>
            {/* Reserve min-height to prevent layout shift when error appears */}
            <div className="min-h-[1.25rem] mt-2" aria-live="polite">
              {serverError ? (
                <p className="text-[var(--destructive)] text-sm">
                  {serverError}
                </p>
              ) : (
                <span className="text-sm opacity-0 select-none" aria-hidden="true">
                  placeholder
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-[var(--success)] hover:opacity-90 disabled:opacity-50 text-[var(--success-foreground)] rounded-lg transition-colors flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <DumbbellSpinner size={16} />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </button>
            {serverPrice !== null && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isPending}
                className="px-4 py-2 bg-[var(--button-secondary-bg)] hover:opacity-80 disabled:opacity-50 text-[var(--button-secondary-foreground)] rounded-lg transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>
      <p className="text-[var(--muted-foreground)] mt-2">Abono mensual</p>
    </div>
  );
}
