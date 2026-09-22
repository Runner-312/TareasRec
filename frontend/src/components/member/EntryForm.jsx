import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api, { fmtDate } from "@/lib/api";

const DOW = ["Mié", "Jue", "Vie", "Sáb", "Dom", "Lun", "Mar"];

export default function EntryForm({ days, dayMinutes, today, weekStart, weekEnd }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [selected, setSelected] = useState(today);
  const [minutes, setMinutes] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);

  const registered = !!dayMinutes[selected];

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    const m = parseInt(minutes, 10);
    if (!m || m <= 0) return toast.error("Ingresa los minutos grabados");
    if (!file) return toast.error("Sube la captura de pantalla como prueba");
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("minutes", String(m));
      fd.append("date", selected);
      fd.append("screenshot", file);
      await api.post("/entries", fd);
      toast.success(`Reporte de ${fmtDate(selected)} guardado`);
      setMinutes("");
      setFile(null);
      setPreview(null);
      qc.invalidateQueries({ queryKey: ["my-dashboard"] });
    } catch (e) {
      toast.error(e.response?.data?.detail || "No se pudo guardar el reporte");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4" data-testid="entry-form">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm text-slate-800">Tu semana</p>
        <p className="text-xs text-slate-400 font-medium">{fmtDate(weekStart)} a {fmtDate(weekEnd)}</p>
      </div>
      <div className="grid grid-cols-7 gap-1.5" data-testid="entry-day-picker">
        {days.map((d, i) => {
          const future = d.date > today;
          const done = !!dayMinutes[d.date];
          const active = d.date === selected;
          return (
            <button
              key={d.date}
              type="button"
              data-testid={`entry-day-${d.date}`}
              data-selected={active || undefined}
              disabled={future}
              onClick={() => setSelected(d.date)}
              className={`rounded-xl py-2 flex flex-col items-center gap-0.5 border transition-all active:scale-95 ${
                active
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-400"
                  : done
                  ? "border-emerald-100 bg-emerald-50/60 text-emerald-700"
                  : future
                  ? "border-slate-100 text-slate-300"
                  : "border-slate-100 bg-slate-50 text-slate-600"
              }`}
            >
              <span className="text-[10px] font-semibold">{DOW[i]}</span>
              <span className="font-mono font-extrabold text-base leading-none">{Number(d.date.slice(-2))}</span>
              <span className="text-[9px] font-mono font-bold h-3">{done ? `${dayMinutes[d.date]}m` : ""}</span>
            </button>
          );
        })}
      </div>

      {registered ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3" data-testid="today-registered-card">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-xs font-semibold text-emerald-800">
            Ya enviaste el reporte de {DOW[days.findIndex((d) => d.date === selected)]} {fmtDate(selected)} ({dayMinutes[selected]} min). Si te equivocaste, bórralo abajo en "Tus últimos registros".
          </p>
        </div>
      ) : (
        <>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Minutos grabados</label>
            <input
              data-testid="employee-minutes-input"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="Ej. 104"
              inputMode="numeric"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="hidden" data-testid="screenshot-upload-input" />
          <button
            type="button"
            data-testid="screenshot-picker-button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 rounded-xl p-3 flex items-center gap-3 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {preview ? (
              <img src={preview} alt="captura" className="w-full max-h-48 object-contain rounded-lg" />
            ) : (
              <>
                <span className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Camera className="w-5 h-5" /></span>
                <span className="text-sm font-bold">Subir captura (obligatoria)</span>
              </>
            )}
          </button>
          <button
            data-testid="submit-minutes-button"
            onClick={submit}
            disabled={sending}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-xl py-3.5 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
          >
            {sending ? "Enviando…" : `Enviar reporte de ${DOW[days.findIndex((d) => d.date === selected)]} ${fmtDate(selected)}`}
          </button>
        </>
      )}
    </div>
  );
}
