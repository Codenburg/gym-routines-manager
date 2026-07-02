"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info, Calendar, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeriadosNotification } from "@/hooks/use-feriados-notification";
import { buildPublicHref } from "@/lib/tenants/href";
import { useOrgSlug } from "@/hooks/use-org-slug";

interface BottomBarProps {
  latestFeriadoDate?: string | null;
}

export function BottomBar({ latestFeriadoDate = null }: BottomBarProps) {
  const pathname = usePathname();
  const orgSlug = useOrgSlug();
  const { hasNew } = useFeriadosNotification(latestFeriadoDate, orgSlug);
  const informacionHref = orgSlug ? buildPublicHref(orgSlug, "/informacion") : null;
  const feriadosHref = orgSlug ? buildPublicHref(orgSlug, "/feriados") : null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background lg:hidden"
      aria-label="Navegación móvil"
    >
      {informacionHref && (
        <Link
          href={informacionHref}
        className={cn(
          "flex flex-col items-center gap-1 p-2 transition-colors hover:bg-accent rounded-md",
          pathname.endsWith("/informacion")
            ? "text-primary"
            : "text-foreground"
        )}
        >
          <Info className="h-5 w-5" />
          <span className="text-xs font-medium">Información</span>
        </Link>
      )}

      {feriadosHref && (
        <Link
          href={feriadosHref}
        className={cn(
          "relative flex flex-col items-center gap-1 p-2 transition-colors hover:bg-accent rounded-md",
          pathname.endsWith("/feriados")
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
      )}

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
