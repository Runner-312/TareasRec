import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon } from "lucide-react";
import api, { fileUrl, fmtMinutes, fmtDateLong } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function EntriesTab() {
  const [viewEntry, setViewEntry] = useState(null);
  const { data: entries, isLoading } = useQuery({
    queryKey: ["entries"],
    queryFn: () => api.get("/admin/entries").then((r) => r.data),
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
              <button
                key={e.id}
                data-testid={`entry-row-${e.id}`}
                onClick={() => setViewEntry(e)}
                className="w-full bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex items-center gap-3 text-left hover:border-sky-200 transition-colors"
              >
                <img src={fileUrl(e.screenshot_path)} alt="captura" className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{e.worker_name}</p>
                  <p className="text-xs text-slate-400">Toca para ver la captura</p>
                </div>
                <span className="font-mono font-bold text-sky-600 text-sm">{fmtMinutes(e.minutes)}</span>
              </button>
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
    </div>
  );
}
