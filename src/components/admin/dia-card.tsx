"use client";

import { cn } from "@/lib/utils";
import {
  Dumbbell,
  ChevronRight,
} from "lucide-react";

interface Ejercicio {
  id: string;
  nombre: string;
  series?: string | null;
  repes?: string | null;
}

interface Dia {
  id: string;
  nombre: string;
  musculosEnfocados?: string | null;
  orden: number;
  ejercicios: Ejercicio[];
}

interface DiaCardProps {
  dia: Dia;
  rutinaId: string;
  index: number;
  className?: string;
}

export function DiaCard({ dia, rutinaId, index, className }: DiaCardProps) {
  const exerciseCount = dia.ejercicios?.length || 0;
  const hasMuscles = !!dia.musculosEnfocados?.trim();

  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-[140px] p-4 bg-surface border border-border rounded-xl hover:bg-hover transition-colors duration-150",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        {/* índice */}
        <span className="text-xs text-muted-foreground">
          #{index + 1}
        </span>
        {/* título */}
        <h3 className="text-sm font-medium truncate">
          {dia.nombre}
        </h3>
      </div>

      {/* Description */}
      <div className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-1 min-h-[20px]">
          {hasMuscles ? dia.musculosEnfocados : "Sin músculos enfocados"}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        {/* Badge - neutral style */}
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            "bg-muted text-muted-foreground border border-border"
          )}
        >
          {exerciseCount} ejercicio{exerciseCount !== 1 ? "s" : ""}
        </span>

        {/* CTA with arrow icon */}
        <a
          href={`/admin/rutinas/${rutinaId}/dias/${dia.id}`}
          className={cn(
            "text-sm text-muted-foreground hover:text-foreground transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
