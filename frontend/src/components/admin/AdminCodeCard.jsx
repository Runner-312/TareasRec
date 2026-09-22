import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Save } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const onlyDigits = (v) => v.replace(/\D/g, "").slice(0, 4);

export default function AdminCodeCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const save = useMutation({
    mutationFn: () => api.post("/admin/change-code", { current_code: current, new_code: next }),
    onSuccess: () => {
      toast.success("Código de administrador actualizado. Úsalo en tu próximo inicio de sesión.");
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "No se pudo cambiar el código"),
  });

  const mismatch = confirm.length === 4 && next !== confirm;
  const ready = current.length === 4 && next.length === 4 && next === confirm;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3" data-testid="admin-code-card">
      <div className="flex items-start gap-3">
        <KeyRound className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-sm text-slate-800">Código de acceso del administrador</p>
          <p className="text-[11px] text-slate-400">4 dígitos. No puede coincidir con el código de ningún miembro. Tu sesión actual sigue activa.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Actual</span>
          <input data-testid="admin-code-current" type="password" value={current} onChange={(e) => setCurrent(onlyDigits(e.target.value))} inputMode="numeric" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-bold text-base tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Nuevo</span>
          <input data-testid="admin-code-new" type="password" value={next} onChange={(e) => setNext(onlyDigits(e.target.value))} inputMode="numeric" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-bold text-base tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Repetir</span>
          <input data-testid="admin-code-confirm" type="password" value={confirm} onChange={(e) => setConfirm(onlyDigits(e.target.value))} inputMode="numeric" className={`mt-1 w-full rounded-xl border px-3 py-2.5 font-mono font-bold text-base tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-sky-500 ${mismatch ? "border-red-300" : "border-slate-200"}`} />
        </label>
      </div>
      {mismatch && <p className="text-[11px] text-red-500" data-testid="admin-code-mismatch">Los códigos no coinciden.</p>}
      <button
        data-testid="admin-code-save-button"
        onClick={() => save.mutate()}
        disabled={!ready || save.isPending}
        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl py-2.5 active:scale-95 transition disabled:opacity-40"
      >
        <Save className="w-4 h-4" /> Cambiar código
      </button>
    </div>
  );
}
