import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api, { fmtMinutes } from "@/lib/api";

export default function EntryForm({ today }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [minutes, setMinutes] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    const m = parseInt(minutes, 10);
    if (!m || m <= 0) return toast.error("Ingresa los minutos grabados hoy");
    if (!file) return toast.error("Sube la captura de pantalla como prueba");
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("minutes", String(m));
      fd.append("screenshot", file);
      await api.post("/entries", fd);
      toast.success("¡Registro guardado! Ya no puedes modificarlo.");
      setMinutes("");
      setFile(null);
      setPreview(null);
      qc.invalidateQueries({ queryKey: ["my-dashboard"] });
    } catch (e) {
      toast.error(e.response?.data?.detail || "No se pudo guardar el registro");
    } finally {
      setSending(false);
    }
  };

  if (today.registered) {
    return (
      <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3" data-testid="today-registered-card">
        <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
        <div>
          <p className="font-bold text-sm text-emerald-800">Ya registraste {fmtMinutes(today.minutes)} hoy</p>
          <p className="text-xs text-emerald-600">Tu registro quedó guardado y visible para el administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Minutos grabados hoy</label>
        <input
          data-testid="employee-minutes-input"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="Ej. 95"
          inputMode="numeric"
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="hidden" data-testid="screenshot-upload-input" />
      <button
        data-testid="screenshot-picker-button"
        onClick={() => fileRef.current?.click()}
        className="w-full border-2 border-dashed border-sky-300 rounded-xl py-6 flex flex-col items-center gap-2 text-sky-600 hover:bg-sky-50 transition-colors"
      >
        {preview ? (
          <img src={preview} alt="captura" className="w-full max-h-48 object-contain rounded-lg" />
        ) : (
          <>
            <Camera className="w-7 h-7" />
            <span className="text-xs font-bold">Subir captura de pantalla</span>
          </>
        )}
      </button>
      <button
        data-testid="submit-minutes-button"
        onClick={submit}
        disabled={sending}
        className="w-full bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold rounded-xl py-3.5 shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
      >
        {sending ? "Guardando…" : "Guardar registro del día"}
      </button>
    </div>
  );
}
