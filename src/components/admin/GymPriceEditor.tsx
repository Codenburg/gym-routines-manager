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

  // When submission finishes successfully, close edit mode and show toast
  useEffect(() => {
    if (!isPending && state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEditing(false);
      toast.success("Precio actualizado exitosamente");
    }
  }, [isPending, state.success]);

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

  // Unified price block
  return (
    <div className="bg-secondary rounded-xl p-4 border border-border">
      {isEditing ? (
        <form action={formAction} className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              type="number"
              name="price"
              defaultValue={serverPrice ?? ""}
              onKeyDown={handleKeyDown}
              disabled={isPending}
              autoFocus
              key={serverPrice}
              className="w-full pl-7 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              placeholder="45000"
              min="0"
              step="100"
            />
            {serverError && (
              <p className="text-destructive text-xs mt-1">{serverError}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-green-600 hover:opacity-90 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isPending ? <><DumbbellSpinner size={16} />Guardando...</> : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isPending}
              className="px-4 py-2 bg-muted hover:opacity-80 disabled:opacity-50 text-foreground rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : serverPrice !== null ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-bold text-foreground">{formatPrice(serverPrice)}</p>
            <p className="text-muted-foreground text-sm">Abono mensual</p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-sm bg-primary hover:opacity-90 text-primary-foreground rounded-lg transition-colors cursor-pointer"
          >
            Editar precio
          </button>
        </div>
      ) : (
        <p className="text-muted-foreground">Sin precio configurado</p>
      )}
    </div>
  );
}
