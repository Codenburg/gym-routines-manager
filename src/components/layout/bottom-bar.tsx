"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomBar() {
  const pathname = usePathname();

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
          "flex flex-col items-center gap-1 p-2 transition-colors hover:bg-accent rounded-md",
          pathname === "/feriados"
            ? "text-primary"
            : "text-foreground"
        )}
      >
        <Calendar className="h-5 w-5" />
        <span className="text-xs font-medium">Feriados</span>
      </Link>
    </nav>
  );
}
