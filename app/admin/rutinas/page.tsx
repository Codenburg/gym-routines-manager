import Link from "next/link";
import { getRutinas, deleteRutina } from "@/app/actions/rutinas";
import { AuthGuard } from "@/components/auth-guard";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function AdminRutinasPage() {
  const rutinas = await getRutinas();

  return (
    <AuthGuard>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rutinas</h1>
          <p className="text-white/60 mt-1">Administra todas las rutinas</p>
        </div>
        <Link
          href="/admin/rutinas/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Rutina
        </Link>
      </div>

      {/* Rutinas List */}
      {rutinas.length > 0 ? (
        <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-white/60 font-medium text-sm">Nombre</th>
                <th className="text-left px-6 py-4 text-white/60 font-medium text-sm">Tipo</th>
                <th className="text-left px-6 py-4 text-white/60 font-medium text-sm">Días</th>
                <th className="text-left px-6 py-4 text-white/60 font-medium text-sm">Descripción</th>
                <th className="text-right px-6 py-4 text-white/60 font-medium text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rutinas.map((rutina) => (
                <tr key={rutina.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">{rutina.nombre}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/70 capitalize">
                      {rutina.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/70">
                    {rutina.diasCount || 0} día{(rutina.diasCount || 0) !== 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4 text-white/50 text-sm max-w-xs truncate">
                    {rutina.descripcion || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/rutinas/${rutina.id}`}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Link>
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          formData.append("id", rutina.id);
                          await deleteRutina(formData as unknown as Parameters<typeof deleteRutina>[0], formData);
                        }}
                      >
                        <button
                          type="submit"
                          className="p-2 hover:bg-red-900/30 rounded-lg text-white/60 hover:text-red-400 transition-colors"
                          title="Eliminar"
                          onClick={(e) => {
                            if (!confirm("¿Estás seguro de que quieres eliminar esta rutina?")) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-900/50 rounded-xl border border-white/10">
          <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-white/50 text-lg">No hay rutinas creadas</p>
          <p className="text-white/40 text-sm mt-2 mb-6">Crea tu primera rutina para comenzar</p>
          <Link
            href="/admin/rutinas/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Rutina
          </Link>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
