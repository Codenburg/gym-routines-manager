import Link from "next/link";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Rutina } from "@/lib/rutinas";
import { buildPublicHref } from "@/lib/tenants/href";

interface RoutineCardProps {
  rutina: Rutina;
  orgSlug?: string;
}

export function RoutineCard({ rutina, orgSlug }: RoutineCardProps) {
  const diasLabel = rutina.diasCount === 1 ? "1 día" : `${rutina.diasCount} días`;
  const href = orgSlug ? buildPublicHref(orgSlug, `/rutinas/${rutina.id}`) : `/rutinas/${rutina.id}`;

  return (
    <Link href={href} prefetch={true}>
      <Card className="group cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 h-full flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg group-hover:text-primary transition-colors text-foreground font-semibold tracking-tight">
              {rutina.nombre}
            </CardTitle>
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
              {rutina.tipo}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          {rutina.descripcion && (
            <p className="text-sm text-muted-foreground line-clamp-2">{rutina.descripcion}</p>
          )}
        </CardContent>
        <CardFooter className="mt-auto">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="shrink-0" />
            {diasLabel}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
