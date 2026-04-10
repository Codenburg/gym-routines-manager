"use client";

import { cn } from "@/lib/utils";

interface Trainer {
  nombre: string;
  count: number;
}

interface TrainerPillsProps {
  trainers: Trainer[];
  selectedTrainers: string[];
  onToggleTrainer: (name: string) => void;
  onClearAll: () => void;
}

export function TrainerPills({
  trainers,
  selectedTrainers,
  onToggleTrainer,
  onClearAll,
}: TrainerPillsProps) {
  if (trainers.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Todos option */}
      <button
        onClick={onClearAll}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 text-sm rounded-full transition-colors",
          selectedTrainers.length === 0
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-accent"
        )}
      >
        <span className="font-medium">Todos</span>
        <span className="text-xs opacity-70">
          {trainers.reduce((acc, t) => acc + t.count, 0)}
        </span>
      </button>

      {/* Trainer pills */}
      {trainers.map((trainer) => {
        const isSelected = selectedTrainers.includes(trainer.nombre);
        return (
          <button
            key={trainer.nombre}
            onClick={() => onToggleTrainer(trainer.nombre)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 text-sm rounded-full transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            <span className="truncate">{trainer.nombre}</span>
            <span className="text-xs opacity-70">{trainer.count}</span>
          </button>
        );
      })}
    </div>
  );
}
