import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Trash2, Check, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { toast } from "sonner";
import api, { fileUrl, fmtMinutes, fmtDateLong, fmtDate, fmtDateTime } from "@/lib/api";
import { currentWeekStartISO, shiftWeek } from "@/lib/week";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const weekEndOf = (ws) => {
  const d = new Date(`${ws}T12:00:00`);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
};

export default function EntriesTab() {
  const qc = useQueryClient();
  const [viewEntry, setViewEntry] = useState(null);
  const [deleteEntry, setDeleteEntry] = useState(null);
  const [workerId, setWorkerId] = useState("");
  const [week, setWeek] = useState("");

  const { data: workers } = useQuery({ queryKey: ["workers"], queryFn: () => api.get("/admin/workers").then((r) => r.data) });
  const { data: entries, isLoading } = useQuery({
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

  const groups = {};
  (entries || []).forEach((e) => {
    groups[e.date] = groups[e.date] || [];
    groups[e.date].push(e);
  });
  const pendingCount = (entries || []).filter((e) => !e.reviewed).length;

  return (
    <div className="space-y-5 fade-up" data-testid="entries-list">
      <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm space-y-2" data-testid="entries-filters">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-sky-500 shrink-0" />
          <select
            data-testid="entries-worker-filter"
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Todos los miembros</option>
            {(workers || []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button data-testid="entries-week-prev" onClick={() => setWeek(shiftWeek(week || currentWeekStartISO(), -1))} className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button
            data-testid="entries-week-label"
            onClick={() => setWeek(week ? "" : currentWeekStartISO())}
            className={`flex-1 text-xs font-bold rounded-xl py-2 transition-colors ${week ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {week ? `Semana ${fmtDate(week)} – ${fmtDate(weekEndOf(week))} · toca para ver todas` : "Todas las semanas · toca para filtrar"}
          </button>
          <button data-testid="entries-week-next" onClick={() => setWeek(shiftWeek(week || currentWeekStartISO(), 1))} className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
        {!isLoading && (
          <p className="text-[11px] text-slate-400 text-center" data-testid="entries-count">
            {(entries || []).length} registro(s) · {pendingCount} sin revisar
          </p>
        )}
      </div>

      {isLoading && <p className="text-center text-slate-400 py-10 text-sm">Cargando registros…</p>}
      {!isLoading && Object.keys(groups).length === 0 && (
        <p className="text-sm text-slate-400 bg-white rounded-2xl border border-slate-100 p-6 text-center">
          No hay registros con estos filtros.
        </p>
      )}
      {Object.entries(groups).map(([day, list]) => (
        <section key={day}>
          <h3 className="font-bold text-slate-800 mb-2 text-sm capitalize">{fmtDateLong(day)}</h3>
          <div className="space-y-2">
            {list.map((e) => (
              <div key={e.id} data-testid={`entry-row-${e.id}`} data-reviewed={e.reviewed} className={`bg-white rounded-2xl border p-3 shadow-sm flex items-center gap-2 ${e.reviewed ? "border-emerald-200" : "border-slate-100"}`}>
                <button onClick={() => setViewEntry(e)} data-testid={`entry-view-${e.id}`} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                  <img src={fileUrl(e.screenshot_path)} alt="captura" className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{e.worker_name}</p>
                    <p className={`text-xs ${e.reviewed ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>{e.reviewed ? "Revisado" : "Toca para ver la captura"}</p>
                    <p className="text-[10px] text-slate-400 font-mono" data-testid={`entry-uploaded-${e.id}`}>Subido: {fmtDateTime(e.created_at)}</p>
                  </div>
                  <span className="font-mono font-bold text-sky-600 text-sm">{fmtMinutes(e.minutes)}</span>
                </button>
                <button
                  data-testid={`entry-review-${e.id}`}
                  onClick={() => review.mutate(e)}
                  aria-label={e.reviewed ? "Quitar revisado" : "Marcar revisado"}
                  className={`p-2.5 rounded-xl active:scale-95 transition shrink-0 ${e.reviewed ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500"}`}
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
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
            <>
              <img data-testid="entry-screenshot-full" src={fileUrl(viewEntry.screenshot_path)} alt="Captura de pantalla" className="w-full rounded-xl bg-slate-100" />
              <button
                data-testid="entry-review-dialog-button"
                onClick={() => { review.mutate(viewEntry); setViewEntry(null); }}
                className={`w-full flex items-center justify-center gap-2 text-white text-xs font-bold rounded-xl py-3 transition-all active:scale-95 ${viewEntry.reviewed ? "bg-slate-500" : "bg-emerald-500 hover:bg-emerald-600"}`}
              >
                <Check className="w-4 h-4" strokeWidth={3} /> {viewEntry.reviewed ? "Quitar marca de revisado" : "Marcar como revisado"}
              </button>
            </>
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
