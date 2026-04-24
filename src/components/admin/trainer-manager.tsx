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

        <div className="p-4">
          {trainers.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No hay entrenadores registrados
            </p>
          ) : (
            <div className="space-y-4">
              {trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
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
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setSelectedTrainer(trainer);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(trainer.id, trainer.name)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
