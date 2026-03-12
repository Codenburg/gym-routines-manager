import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RutinaForm } from "@/components/admin/rutina-form";
import Link from "next/link";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function NewRutinaPage() {
  const session = await auth.api.getSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
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
          <h1 className="text-2xl font-bold text-white">Nueva Rutina</h1>
          <p className="text-white/60 mt-1">Crea una nueva rutina de entrenamiento</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <RutinaForm
          onSuccess={() => {
            redirect("/admin/rutinas");
          }}
        />
      </div>
    </div>
  );
}
