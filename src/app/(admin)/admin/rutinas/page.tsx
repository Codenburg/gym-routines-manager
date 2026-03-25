import Link from "next/link";
import { getRutinas } from "@/lib/rutinas";
import { RutinasListClient } from "@/components/admin/rutinas-list-client";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function AdminRutinasPage() {
  const rutinas = await getRutinas();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rutinas"
        description="Administra las rutinas de entrenamiento"
        backHref="/admin"
        actions={
          <Link href="/admin/rutinas/new">
            <Button>
              <Plus className="w-5 h-5 mr-2" />
              Nueva Rutina
            </Button>
          </Link>
        }
      />

      {/* Rutinas List - Client Component handles search, filter, and actions */}
      <RutinasListClient rutinas={rutinas} />
    </div>
  );
}
