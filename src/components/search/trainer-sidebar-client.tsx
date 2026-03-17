"use client";

import { TrainerSidebar } from "./trainer-sidebar";
import { useUnifiedSearch } from "@/hooks/use-unified-search";

interface Trainer {
  nombre: string;
  count: number;
}

interface TrainerSidebarClientProps {
  initialTrainers: Trainer[];
}

export function TrainerSidebarClient({ initialTrainers }: TrainerSidebarClientProps) {
  const { trainerFilters, toggleTrainerFilter, clearTrainerFilters } = useUnifiedSearch();

  return (
    <TrainerSidebar
      trainers={initialTrainers}
      selectedTrainers={trainerFilters}
      onToggleTrainer={toggleTrainerFilter}
      onClearAll={clearTrainerFilters}
    />
  );
}
