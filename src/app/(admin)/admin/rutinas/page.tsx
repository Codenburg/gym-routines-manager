import Link from "next/link";
import { getRutinas } from "@/app/actions/rutinas";
import { RutinasListClient } from "@/components/admin/rutinas-list-client";
import { ArrowLeft, Plus } from "lucide-react";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function AdminRutinasPage() {
  const rutinas = await getRutinas();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="p-2 hover:bg-[var(--button-secondary-bg)] rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Rutinas</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Administra todas las rutinas</p>
        </div>
        <Link
          href="/admin/rutinas/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--button-primary-bg)] hover:opacity-90 text-[var(--button-primary-foreground)] rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Rutina
        </Link>
      </div>

      {/* Rutinas List - Client Component handles search, filter, and actions */}
      <RutinasListClient rutinas={rutinas} />
    </div>
  );
}
