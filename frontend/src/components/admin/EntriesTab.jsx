import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Check } from "lucide-react";
import { toast } from "sonner";
import api, { fileUrl, fmtMinutes, fmtDateLong } from "@/lib/api";
import ScreenshotViewer from "@/components/ScreenshotViewer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import EntryRow from "@/components/admin/EntryRow";
import EntriesFilters from "@/components/admin/EntriesFilters";

const groupByDate = (entries) =>
  entries.reduce((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});

export default function EntriesTab() {
  const qc = useQueryClient();
  const [viewEntry, setViewEntry] = useState(null);
  const [deleteEntry, setDeleteEntry] = useState(null);
  const [workerId, setWorkerId] = useState("");
  const [week, setWeek] = useState("");

  const { data: workers } = useQuery({ queryKey: ["workers"], queryFn: () => api.get("/admin/workers").then((r) => r.data) });
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entries", workerId, week],
    queryFn: () => api.get("/admin/entries", { params: { worker_id: workerId || undefined, week_start: week || undefined } }).then((r) => r.data),
  });

  const review = useMutation({
    mutationFn: (e) => api.patch(`/admin/entries/${e.id}/review`, null, { params: { reviewed: !e.reviewed } }),
    onSuccess: (_, e) => {
      toast.success(e.reviewed ? "Marcado como no revisado" : "Registro revisado");
      qc.invalidateQueries({ queryKey: ["entries"] });
    },
    onError: () => toast.error("No se pudo actualizar"),
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

  const groups = groupByDate(entries);

  return (
    <div className="space-y-5 fade-up" data-testid="entries-list">
      <EntriesFilters
        workers={workers}
        workerId={workerId}
        onWorker={setWorkerId}
        week={week}
        onWeek={setWeek}
        count={entries.length}
        pendingCount={entries.filter((e) => !e.reviewed).length}
        loading={isLoading}
      />

      {isLoading && <p className="text-center text-slate-400 py-10 text-sm">Cargando registros…</p>}
      {!isLoading && entries.length === 0 && (
        <p className="text-sm text-slate-400 bg-white rounded-2xl border border-slate-100 p-6 text-center">No hay registros con estos filtros.</p>
      )}
      {Object.entries(groups).map(([day, list]) => (
        <section key={day}>
          <h3 className="font-bold text-slate-800 mb-2 text-sm capitalize">{fmtDateLong(day)}</h3>
          <div className="space-y-2">
            {list.map((e) => <EntryRow key={e.id} entry={e} onView={setViewEntry} onReview={review.mutate} onDelete={setDeleteEntry} />)}
          </div>
        </section>
      ))}

      <ScreenshotViewer
        open={!!viewEntry}
        onClose={() => setViewEntry(null)}
        src={viewEntry ? fileUrl(viewEntry.screenshot_path) : ""}
        title={viewEntry ? `${viewEntry.worker_name} — ${fmtMinutes(viewEntry.minutes)}` : ""}
        subtitle={viewEntry ? fmtDateLong(viewEntry.date) : ""}
        footer={viewEntry && (
          <button
            data-testid="entry-review-dialog-button"
            onClick={() => { review.mutate(viewEntry); setViewEntry(null); }}
            className={`w-full flex items-center justify-center gap-2 text-white text-xs font-bold rounded-xl py-3 transition-all active:scale-95 ${viewEntry.reviewed ? "bg-slate-500" : "bg-emerald-500 hover:bg-emerald-600"}`}
          >
            <Check className="w-4 h-4" strokeWidth={3} /> {viewEntry.reviewed ? "Quitar marca de revisado" : "Marcar como revisado"}
          </button>
        )}
      />

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
            <AlertDialogAction data-testid="entry-delete-confirm-button" onClick={() => del.mutate(deleteEntry.id)} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
