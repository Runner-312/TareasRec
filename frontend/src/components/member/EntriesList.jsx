import { fileUrl, fmtMinutes, fmtDate } from "@/lib/api";

export default function EntriesList({ entries }) {
  return (
    <section className="fade-up">
      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">Tus últimos registros</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400 bg-white rounded-2xl border border-slate-100 p-5 text-center">Aún no tienes registros.</p>
      ) : (
        <div className="space-y-2" data-testid="my-entries-list">
          {entries.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex items-center gap-3">
              <img src={fileUrl(e.screenshot_path)} alt="captura" className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-800 capitalize">{fmtDate(e.date)}</p>
                <p className="text-[11px] text-slate-400">Registro verificado</p>
              </div>
              <span className="font-mono font-bold text-sky-600 text-sm">{fmtMinutes(e.minutes)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
