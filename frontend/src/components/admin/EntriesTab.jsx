import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { fileUrl, fmtMinutes, fmtDateLong } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function EntriesTab() {
  const qc = useQueryClient();
  const [viewEntry, setViewEntry] = useState(null);
  const [deleteEntry, setDeleteEntry] = useState(null);
  const { data: entries, isLoading } = useQuery({
    queryKey: ["entries"],
    queryFn: () => api.get("/admin/entries").then((r) => r.data),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/admin/entries/${id}`),
    onSuccess: () => {
      toast.success("Registro eliminado");
      setDeleteEntry(null);
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(e.response?.data?.detail || "No se pudo eliminar"),
  });

  if (isLoading) return <p className="text-center text-slate-400 py-10 text-sm">Cargando registros…</p>;

  const groups = {};
  (entries || []).forEach((e) => {
    groups[e.date] = groups[e.date] || [];
    groups[e.date].push(e);
  });

  return (
    <div className="space-y-5 fade-up" data-testid="entries-list">
      {Object.keys(groups).length === 0 && (
        <p className="text-sm text-slate-400 bg-white rounded-2xl border border-slate-100 p-6 text-center">
          Aún no hay registros de minutos.
        </p>
      )}
      {Object.entries(groups).map(([day, list]) => (
        <section key={day}>
          <h3 className="font-bold text-slate-800 mb-2 text-sm capitalize">{fmtDateLong(day)}</h3>
          <div className="space-y-2">
            {list.map((e) => (
              <div key={e.id} data-testid={`entry-row-${e.id}`} className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex items-center gap-3">
                <button onClick={() => setViewEntry(e)} data-testid={`entry-view-${e.id}`} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                  <img src={fileUrl(e.screenshot_path)} alt="captura" className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{e.worker_name}</p>
                    <p className="text-xs text-slate-400">Toca para ver la captura</p>
                  </div>
                  <span className="font-mono font-bold text-sky-600 text-sm">{fmtMinutes(e.minutes)}</span>
                </button>
                <button data-testid={`entry-delete-${e.id}`} onClick={() => setDeleteEntry(e)} className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 transition shrink-0">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      <Dialog open={!!viewEntry} onOpenChange={() => setViewEntry(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="w-5 h-5 text-sky-500" />
              {viewEntry?.worker_name} — {viewEntry && fmtMinutes(viewEntry.minutes)}
            </DialogTitle>
          </DialogHeader>
          {viewEntry && (
            <img
              data-testid="entry-screenshot-full"
              src={fileUrl(viewEntry.screenshot_path)}
              alt="Captura de pantalla"
              className="w-full rounded-xl bg-slate-100"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteEntry && `${deleteEntry.worker_name} · ${fmtMinutes(deleteEntry.minutes)} · ${fmtDateLong(deleteEntry.date)}. `}
              Se restarán del total, ranking y pago de esa semana. El miembro podrá registrar ese día de nuevo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="entry-delete-cancel-button">Cancelar</AlertDialogCancel>
            <AlertDialogAction data-testid="entry-delete-confirm-button" onClick={() => del.mutate(deleteEntry.id)} className="bg-red-500 hover:bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
