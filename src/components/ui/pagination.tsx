import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  search: string;
  trainers: string[];
  basePath?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  search,
  trainers,
  basePath = "/",
}: PaginationProps) {
  // Build base search params
  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (trainers.length > 0) params.set("trainers", trainers.join(","));
    if (page > 1) params.set("page", String(page));
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // If only one page, don't render pagination
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-8"
      aria-label="Paginación"
    >
      {/* Previous button */}
      {canGoPrev ? (
        <Link href={buildHref(currentPage - 1)} scroll={false}>
          <Button variant="outline" size="sm" className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" className="gap-2" disabled>
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
      )}

      {/* Page indicator */}
      <span className="text-sm text-muted-foreground px-2">
        Página {currentPage} de {totalPages}
      </span>

      {/* Next button */}
      {canGoNext ? (
        <Link href={buildHref(currentPage + 1)} scroll={false}>
          <Button variant="outline" size="sm" className="gap-2">
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" className="gap-2" disabled>
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </nav>
  );
}
