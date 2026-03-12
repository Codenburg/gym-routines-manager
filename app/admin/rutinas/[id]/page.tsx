import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRutina, deleteRutina } from "@/app/actions/rutinas";
import { RutinaForm } from "@/components/admin/rutina-form";
import { DiaManager } from "@/components/admin/dia-manager";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/auth-guard";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface EditRutinaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRutinaPage({ params }: EditRutinaPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const rutina = await getRutina(id);

  if (!rutina) {
    notFound();
  }

  const handleDelete = async () => {
    "use server";
    const formData = new FormData();
    formData.append("id", id);
    await deleteRutina(formData as unknown as Parameters<typeof deleteRutina>[0], formData);
    redirect("/admin/rutinas");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/rutinas"
            className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Editar Rutina</h1>
            <p className="text-white/60 mt-1">Modifica los detalles de la rutina</p>
          </div>
        </div>
        <form action={handleDelete}>
          <Button
            type="submit"
            variant="danger"
            onClick={(e) => {
              if (!confirm("¿Estás seguro de que quieres eliminar esta rutina? Esta acción no se puede deshacer.")) {
                e.preventDefault();
              }
            }}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar Rutina
          </Button>
        </form>
      </div>

      {/* Edit Form */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Detalles de la Rutina</h2>
        <RutinaForm
          initialData={{
            id: rutina.id,
            nombre: rutina.nombre,
            tipo: rutina.tipo as "fuerza" | "cardio" | "flexibilidad" | "hipertrofia",
            descripcion: rutina.descripcion || undefined,
          }}
        />
      </div>

      {/* Days Manager */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <DiaManager rutinaId={rutina.id} dias={rutina.dias} />
      </div>
    </div>
  );
}
