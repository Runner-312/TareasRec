import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Pencil, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import api, { fmtMinutes } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function WorkersTab() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editWorker, setEditWorker] = useState(null);
  const [deleteWorker, setDeleteWorker] = useState(null);

  const { data: workers, isLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: () => api.get("/admin/workers").then((r) => r.data),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/admin/workers/${id}`),
    onSuccess: () => {
      toast.success("Miembro eliminado");
      setDeleteWorker(null);
      qc.invalidateQueries({ queryKey: ["workers"] });
    },
    onError: () => toast.error("No se pudo eliminar"),
  });

  return (
    <div className="space-y-4 fade-up">
      <button
        data-testid="employee-add-button"
        onClick={() => setAddOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold rounded-xl py-3.5 shadow-lg shadow-sky-500/25 transition-all"
      >
        <UserPlus className="w-5 h-5" /> Agregar miembro
      </button>

      {isLoading ? (
        <p className="text-center text-slate-400 py-8 text-sm">Cargando…</p>
      ) : workers.length === 0 ? (
        <p className="text-sm text-slate-400 bg-white rounded-2xl border border-slate-100 p-6 text-center" data-testid="no-workers-message">
          Aún no hay miembros. Agrega el primero con el botón de arriba.
        </p>
      ) : (
        <div className="space-y-2" data-testid="workers-list">
          {workers.map((w) => (
            <div key={w.id} data-testid={`worker-row-${w.id}`} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-800 truncate">{w.name}</p>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Código: <span className="font-mono font-bold text-slate-600">{w.code}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Semana: <span className="font-mono font-bold text-sky-600">{fmtMinutes(w.week_minutes)}</span> · Total: <span className="font-mono font-bold text-slate-600">{fmtMinutes(w.total_minutes)}</span>
                </p>
              </div>
              <button data-testid={`worker-edit-${w.id}`} onClick={() => setEditWorker(w)} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition">
                <Pencil className="w-4 h-4 text-slate-600" />
              </button>
              <button data-testid={`worker-delete-${w.id}`} onClick={() => setDeleteWorker(w)} className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 transition">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      <WorkerForm open={addOpen} onClose={() => setAddOpen(false)} title="Nuevo miembro" testId="add" />
      {editWorker && <WorkerForm open onClose={() => setEditWorker(null)} title={`Editar: ${editWorker.name}`} worker={editWorker} testId="edit" />}

      <AlertDialog open={!!deleteWorker} onOpenChange={() => setDeleteWorker(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {deleteWorker?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Ya no podrá iniciar sesión. Sus registros históricos se conservan para los pagos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-cancel-button">Cancelar</AlertDialogCancel>
            <AlertDialogAction data-testid="delete-confirm-button" onClick={() => del.mutate(deleteWorker.id)} className="bg-red-500 hover:bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WorkerForm({ open, onClose, title, worker, testId }) {
  const qc = useQueryClient();
  const [name, setName] = useState(worker?.name || "");
  const [code, setCode] = useState("");

  const save = useMutation({
    mutationFn: () =>
      worker
        ? api.put(`/admin/workers/${worker.id}`, { name, code: code || undefined })
        : api.post("/admin/workers", { name, code }),
    onSuccess: () => {
      toast.success(worker ? "Miembro actualizado" : "Miembro creado");
      qc.invalidateQueries({ queryKey: ["workers"] });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Error al guardar"),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</label>
            <input
              data-testid={`worker-name-input-${testId}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. María"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Código de 4 dígitos {worker && "(dejar vacío para no cambiar)"}
            </label>
            <input
              data-testid={`worker-code-input-${testId}`}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder={worker ? "••••" : "Ej. 4521"}
              inputMode="numeric"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button
            data-testid={`worker-save-button-${testId}`}
            onClick={() => save.mutate()}
            disabled={save.isPending || !name.trim() || (!worker && code.length !== 4)}
            className="w-full bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold rounded-xl py-3 transition-all disabled:opacity-40"
          >
            {save.isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
