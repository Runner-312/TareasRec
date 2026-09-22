import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import api, { fileUrl, fmtMinutes, fmtDate, fmtDateTime } from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function EntriesList({ entries, weekStart, weekEnd }) {
  const qc = useQueryClient();
  const [target, setTarget] = useState(null);
  const del = useMutation({
    mutationFn: (id) => api.delete(`/entries/${id}`),
    onSuccess: () => {
      toast.success("Reporte eliminado. Puedes volver a enviarlo.");
      setTarget(null);
      qc.invalidateQueries({ queryKey: ["my-dashboard"] });
    },
    onError: (e) => toast.error(e.response?.data?.detail || "No se pudo eliminar"),
  });

  return (
    <section className="fade-up">
      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">Tus últimos registros</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400 bg-white rounded-2xl border border-slate-100 p-5 text-center">Aún no tienes registros.</p>
      ) : (
        <div className="space-y-2" data-testid="my-entries-list">
          {entries.map((e) => {
            const deletable = e.date >= weekStart && e.date <= weekEnd;
            return (
              <div key={e.id} data-testid={`my-entry-${e.id}`} className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex items-center gap-3">
                <img src={fileUrl(e.screenshot_path)} alt="captura" className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 capitalize">{fmtDate(e.date)}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1" data-testid={`my-entry-uploaded-${e.id}`}>
                    <Clock className="w-3 h-3" /> Subido: {fmtDateTime(e.created_at)}{e.reviewed ? " · revisado ✓" : ""}
                  </p>
                </div>
                <span className="font-mono font-bold text-sky-600 text-sm">{fmtMinutes(e.minutes)}</span>
                {deletable && (
                  <button data-testid={`my-entry-delete-${e.id}`} onClick={() => setTarget(e)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 transition shrink-0" aria-label="Borrar reporte">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!target} onOpenChange={() => setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar el reporte del {target && fmtDate(target.date)}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán {target && fmtMinutes(target.minutes)} de tu semana. Después podrás enviar de nuevo el reporte de ese día con los datos correctos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="my-entry-delete-cancel">Cancelar</AlertDialogCancel>
            <AlertDialogAction data-testid="my-entry-delete-confirm" onClick={() => del.mutate(target.id)} className="bg-red-500 hover:bg-red-600">Borrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
