"use client";

import { useState, useCallback } from "react";
import { updateGymPrice } from "@/app/actions/gym";
import { DumbbellSpinner } from "@/components/ui/dumbbell-spinner";

type EditorState = "loading" | "display" | "editing" | "saving" | "error";

interface GymPriceEditorProps {
  initialPrice: number | null;
}

export function GymPriceEditor({ initialPrice }: GymPriceEditorProps) {
  // Determine initial state based on whether we have a valid price
  const hasValidPrice = initialPrice !== null && initialPrice > 0;
  const [state, setState] = useState<EditorState>(
    !hasValidPrice ? "editing" : "display"
  );
  const [price, setPrice] = useState<number | null>(hasValidPrice ? initialPrice : null);
  const [editValue, setEditValue] = useState<string>(
    hasValidPrice ? initialPrice.toString() : ""
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatPrice = useCallback((value: number): string => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
  }, []);

  const handleStartEdit = useCallback(() => {
    setEditValue(price !== null ? price.toString() : "");
    setState("editing");
    setErrorMessage(null);
  }, [price]);

  const handleCancel = useCallback(() => {
    if (price !== null) {
      setEditValue(price.toString());
      setState("display");
    } else {
      // If we have no price, stay in editing mode
      setState("editing");
    }
    setErrorMessage(null);
  }, [price]);

  const handleSave = useCallback(async () => {
    const newPrice = parseFloat(editValue);

    if (isNaN(newPrice) || newPrice <= 0) {
      setErrorMessage("Ingrese un precio válido y positivo");
      return;
    }

    setState("saving");
    setErrorMessage(null);

    try {
      const result = await updateGymPrice(newPrice);

      if (!result.success) {
        throw new Error(result.message);
      }

      if (result.data) {
        setPrice(result.data.price);
        setEditValue(result.data.price.toString());
      }
      setState("display");
    } catch (error) {
      console.error("Failed to save price:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Error al guardar el precio"
      );
      setState("error");

      // Reset to display state after showing error
      setTimeout(() => {
        if (price !== null) {
          setState("display");
        } else {
          setState("editing");
        }
      }, 3000);
    }
  }, [editValue, price]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSave();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  // Loading state - when price is still being fetched (shouldn't happen since parent handles this)
  if (state === "loading") {
    return (
      <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-4">
          Precio
        </h2>
        <div className="h-10 w-32 bg-[var(--button-secondary-bg)] rounded animate-pulse" />
      </div>
    );
  }

  // Display state - shows the current price
  if (state === "display" && price !== null) {
    return (
      <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-4">
          Precio
        </h2>
        <div className="flex items-center gap-4">
          <p className="text-3xl font-bold text-[var(--foreground)]">
            {formatPrice(price)}
          </p>
          <button
            onClick={handleStartEdit}
            className="px-3 py-1.5 text-sm bg-[var(--button-primary-bg)] hover:opacity-90 text-[var(--button-primary-foreground)] rounded-lg transition-colors"
          >
            Editar precio
          </button>
        </div>
        <p className="text-[var(--muted-foreground)] mt-2">Abono mensual</p>
      </div>
    );
  }

  // Editing/saving/error state - input mode
  if (state === "editing" || state === "saving" || state === "error") {
    const isSaving = state === "saving";
    const isError = state === "error";

    return (
      <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-4">
          Precio
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                $
              </span>
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                className="w-full pl-7 pr-4 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
                placeholder="45000"
                min="0"
                step="100"
              />
            </div>
            {isError && errorMessage && (
              <p className="text-[var(--destructive)] text-sm mt-2">{errorMessage}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-[var(--success)] hover:opacity-90 disabled:opacity-50 text-[var(--success-foreground)] rounded-lg transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <DumbbellSpinner size={16} />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </button>
            {price !== null && (
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 bg-[var(--button-secondary-bg)] hover:opacity-80 disabled:opacity-50 text-[var(--button-secondary-foreground)] rounded-lg transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
        <p className="text-[var(--muted-foreground)] mt-2">Abono mensual</p>
      </div>
    );
  }

  return null;
}
