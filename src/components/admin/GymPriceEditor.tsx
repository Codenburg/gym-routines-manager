"use client";

import { useState, useCallback } from "react";
import { updateGymPrice } from "@/app/actions/gym";
import { DumbbellSpinner } from "@/components/ui/dumbbell-spinner";

type EditorState = "loading" | "display" | "editing" | "saving" | "error";

interface GymPriceEditorProps {
  initialPrice: number;
}

export function GymPriceEditor({ initialPrice }: GymPriceEditorProps) {
  const [state, setState] = useState<EditorState>(
    initialPrice === 0 ? "loading" : "display"
  );
  const [price, setPrice] = useState<number>(initialPrice);
  const [editValue, setEditValue] = useState<string>(initialPrice.toString());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatPrice = useCallback((value: number): string => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
  }, []);

  const handleStartEdit = useCallback(() => {
    setEditValue(price.toString());
    setState("editing");
    setErrorMessage(null);
  }, [price]);

  const handleCancel = useCallback(() => {
    setEditValue(price.toString());
    setState("display");
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
        setState("display");
      }, 3000);
    }
  }, [editValue]);

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

  if (state === "display") {
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
                className="w-full pl-7 pr-4 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                placeholder="45000"
                min="0"
                step="100"
              />
            </div>
            {isError && errorMessage && (
              <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
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
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-[var(--button-secondary-bg)] hover:opacity-80 disabled:opacity-50 text-[var(--button-secondary-foreground)] rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
        <p className="text-[var(--muted-foreground)] mt-2">Abono mensual</p>
      </div>
    );
  }

  return null;
}
