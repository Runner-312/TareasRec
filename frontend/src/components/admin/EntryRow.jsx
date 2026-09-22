import { Trash2, Check } from "lucide-react";
import { fileUrl, fmtMinutes, fmtDateTime } from "@/lib/api";

export default function EntryRow({ entry: e, onView, onReview, onDelete }) {
  return (
    <div data-testid={`entry-row-${e.id}`} data-reviewed={e.reviewed} className={`bg-white rounded-2xl border p-3 shadow-sm flex items-center gap-2 ${e.reviewed ? "border-emerald-200" : "border-slate-100"}`}>
      <button onClick={() => onView(e)} data-testid={`entry-view-${e.id}`} className="flex-1 min-w-0 flex items-center gap-3 text-left">
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
        onClick={() => onReview(e)}
        aria-label={e.reviewed ? "Quitar revisado" : "Marcar revisado"}
        className={`p-2.5 rounded-xl active:scale-95 transition shrink-0 ${e.reviewed ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500"}`}
      >
        <Check className="w-4 h-4" strokeWidth={3} />
      </button>
      <button data-testid={`entry-delete-${e.id}`} onClick={() => onDelete(e)} className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 transition shrink-0">
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>
    </div>
  );
}
