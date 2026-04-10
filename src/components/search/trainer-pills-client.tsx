"use client";

import { useUnifiedSearch } from "@/hooks/use-unified-search";
import { TrainerPills } from "@/components/search/trainer-pills";

interface Trainer {
  nombre: string;
  count: number;
}

interface TrainerPillsClientProps {
  trainers: Trainer[] | null;
}

export function TrainerPillsClient({ trainers }: TrainerPillsClientProps) {
  const { trainerFilters, toggleTrainerFilter, clearTrainerFilters } = useUnifiedSearch();

  if (trainers === null) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">No disponible</p>
      </div>
    );
  }

  if (trainers.length === 0) {
    return null;
  }

  return (
    <TrainerPills
      trainers={trainers}
      selectedTrainers={trainerFilters}
      onToggleTrainer={toggleTrainerFilter}
      onClearAll={clearTrainerFilters}
    />
  );
}
