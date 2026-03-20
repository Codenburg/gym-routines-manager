"use client";

import { TrainerSidebar } from "./trainer-sidebar";
import { useUnifiedSearch } from "@/hooks/use-unified-search";

interface Trainer {
  nombre: string;
  count: number;
}

interface TrainerSidebarClientProps {
  trainers: Trainer[];
  hasError: boolean;
}

export function TrainerSidebarClient({ trainers, hasError }: TrainerSidebarClientProps) {
  const { trainerFilters, toggleTrainerFilter, clearTrainerFilters } = useUnifiedSearch();

  // Single source of truth: when routines have error, sidebar shows unavailable
  if (hasError) {
    return (
      <aside className="w-full lg:w-64 flex-shrink-0 mt-0" data-testid="trainer-sidebar-error">
        <div className="bg-card border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Entrenadores</h3>
          </div>
          <p className="text-sm text-muted-foreground">No disponible</p>
        </div>
      </aside>
    );
  }

  // Empty state
  if (trainers.length === 0) {
    return null;
  }

  return (
    <div data-testid="trainer-sidebar">
      <TrainerSidebar
        trainers={trainers}
        selectedTrainers={trainerFilters}
        onToggleTrainer={toggleTrainerFilter}
        onClearAll={clearTrainerFilters}
      />
    </div>
  );
}
