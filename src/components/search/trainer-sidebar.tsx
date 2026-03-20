"use client";

import { useState } from "react";
import { Check, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Trainer {
  nombre: string;
  count: number;
}

interface TrainerSidebarProps {
  trainers: Trainer[];
  selectedTrainers: string[];
  onToggleTrainer: (name: string) => void;
  onClearAll: () => void;
}

export function TrainerSidebar({
  trainers,
  selectedTrainers,
  onToggleTrainer,
  onClearAll,
}: TrainerSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (trainers.length === 0) {
    return null;
  }

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 mt-0">
      <div className="bg-card border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-foreground">Entrenadores</h3>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-1 hover:bg-accent rounded"
            aria-label={isOpen ? "Colapsar panel" : "Expandir panel"}
          >
            <span className="text-xs">{isOpen ? "−" : "+"}</span>
          </button>
        </div>

        {/* Content */}
        <div className={cn("space-y-2", !isOpen && "hidden lg:block")}>
          {/* Todos option */}
          <button
            onClick={onClearAll}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
              selectedTrainers.length === 0
                ? "bg-blue-500 text-white"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground"
            )}
          >
            <span className="font-medium">Todos</span>
            <span className="ml-auto text-xs opacity-70">
              {trainers.reduce((acc, t) => acc + t.count, 0)}
            </span>
          </button>

          {/* Divider */}
          <div className="border-t my-2" />

          {/* Trainer list */}
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {trainers.map((trainer) => {
              const isSelected = selectedTrainers.includes(trainer.nombre);
              return (
                <button
                  key={trainer.nombre}
                  onClick={() => onToggleTrainer(trainer.nombre)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                    isSelected
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-slate-400 dark:border-slate-500"
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <span className="truncate text-foreground">{trainer.nombre}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {trainer.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
