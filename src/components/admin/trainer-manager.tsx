"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { TrainerDialog, type Trainer } from "@/components/admin/trainer-dialog";
import { AdminCard } from "@/components/admin/admin-card";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { deleteTrainer } from "@/app/actions/trainers";

interface TrainerManagerProps {
  initialTrainers: Trainer[];
}

// Avatar color palette based on trainer id hash
const AVATAR_COLORS = [
  "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  "bg-pink-500/10 text-pink-600 dark:text-pink-400",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function TrainerManager({ initialTrainers }: TrainerManagerProps) {
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);

  const { confirm } = useConfirm();

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: `¿Eliminar a ${name}?`,
      description: "El entrenador dejará de tener acceso al panel de administración. Esta acción no se puede deshacer.",
      variant: "destructive",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;

    const result = await deleteTrainer(id);

    if (result.success) {
      setTrainers((prev) => prev.filter((t) => t.id !== id));
      toast.success("Entrenador eliminado exitosamente");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="container py-8">
      <PageHeader
        title="Entrenadores"
        description="Gestiona los entrenadores del gimnasio"
        actions={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Entrenador
          </Button>
        }
      />

      {/* Trainers List */}
      <AdminCard variant="standard">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Entrenadores Existentes ({trainers.length})
          </h3>
        </div>

        <div className="divide-y divide-border">
          {trainers.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No hay entrenadores registrados
            </p>
          ) : (
            trainers.map((trainer) => (
              <div
                key={trainer.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getAvatarColor(trainer.id)}`}>
                    <span className="text-sm font-medium">
                      {trainer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{trainer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      @{trainer.username} • Creado el {new Date(trainer.createdAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedTrainer(trainer);
                      setEditDialogOpen(true);
                    }}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(trainer.id, trainer.name)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </AdminCard>

      {/* Create Trainer Dialog */}
      <TrainerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
        onSuccess={(trainer) => {
          setTrainers((prev) => [...prev, trainer]);
          setCreateDialogOpen(false);
        }}
      />

      {/* Edit Trainer Dialog */}
      <TrainerDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedTrainer(null);
        }}
        mode="edit"
        trainer={selectedTrainer}
        onSuccess={(trainer) => {
          setTrainers((prev) => prev.map((t) => (t.id === trainer.id ? trainer : t)));
          setEditDialogOpen(false);
          setSelectedTrainer(null);
        }}
      />
    </div>
  );
}
