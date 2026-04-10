"use client";

import { TrainerPills } from "./trainer-pills";
import { useUnifiedSearch } from "@/hooks/use-unified-search";

interface Trainer {
  nombre: string;
  count: number;
}

interface TrainerSidebarClientProps {
  trainers: Trainer[] | null;
}

export function TrainerSidebarClient({ trainers }: TrainerSidebarClientProps) {
  const { trainerFilters, toggleTrainerFilter, clearTrainerFilters } = useUnifiedSearch();

  // null means DB error - show unavailable
  if (trainers === null) {
    return (
      <aside className="w-full lg:w-64 flex-shrink-0 mt-0" data-testid="trainer-sidebar-error">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Entrenadores</h3>
          </div>
          <p className="text-sm text-muted-foreground">No disponible</p>
        </div>
      </aside>
    );
  }

  // Empty state - legitimate empty list, not an error
  if (trainers.length === 0) {
    return null;
  }

  return (
    <div data-testid="trainer-sidebar">
      <TrainerPills
        trainers={trainers}
        selectedTrainers={trainerFilters}
        onToggleTrainer={toggleTrainerFilter}
        onClearAll={clearTrainerFilters}
      />
    </div>
  );
}
