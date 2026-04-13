"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info, Calendar, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeriadosNotification } from "@/hooks/use-feriados-notification";

export function BottomBar() {
  const pathname = usePathname();
  const { hasNew } = useFeriadosNotification();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background lg:hidden"
      aria-label="Navegación móvil"
    >
      <Link
        href="/informacion"
        className={cn(
          "flex flex-col items-center gap-1 p-2 transition-colors hover:bg-accent rounded-md",
          pathname === "/informacion"
            ? "text-primary"
            : "text-foreground"
        )}
      >
        <Info className="h-5 w-5" />
        <span className="text-xs font-medium">Información</span>
      </Link>

      <Link
        href="/feriados"
        className={cn(
          "relative flex flex-col items-center gap-1 p-2 transition-colors hover:bg-accent rounded-md",
          pathname === "/feriados"
            ? "text-primary"
            : "text-foreground"
        )}
      >
        <Calendar className="h-5 w-5" />
        <span className="text-xs font-medium">Feriados</span>
        {hasNew && (
          <span className="absolute top-1 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-600 text-white text-[9px] font-bold shadow-md ring-1 ring-background">
            <span aria-hidden="true">!</span>
            <span className="sr-only">Nuevos feriados</span>
          </span>
        )}
      </Link>

      <Link
        href="/admin/login"
        className={cn(
          "flex flex-col items-center gap-1 p-2 transition-colors hover:bg-accent rounded-md",
          pathname === "/admin/login"
            ? "text-primary"
            : "text-foreground"
        )}
      >
        <Lock className="h-5 w-5" />
        <span className="text-xs font-medium">Admin</span>
      </Link>
    </nav>
  );
}
