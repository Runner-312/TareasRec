import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coins, Save, History, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import api, { fmtDate, fmtMoney } from "@/lib/api";

export default function RatesCard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["rates"], queryFn: () => api.get("/admin/rates").then((r) => r.data) });
  const [kgen, setKgen] = useState("");
  const [bonus, setBonus] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const history = data?.history || [];
  useEffect(() => {
    if (data) {
      setKgen(String(data.current.kgen_rate));
      setBonus(String(data.current.bonus_rate));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.put("/admin/rates", { kgen_rate: parseFloat(kgen), bonus_rate: parseFloat(bonus) }),
    onSuccess: () => {
      toast.success("Tarifas actualizadas para esta semana en adelante");
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(e.response?.data?.detail || "No se pudo guardar"),
  });

  if (!data) return null;
  const valid = kgen !== "" && bonus !== "" && !isNaN(parseFloat(kgen)) && !isNaN(parseFloat(bonus));
  const changed = parseFloat(kgen) !== data.current.kgen_rate || parseFloat(bonus) !== data.current.bonus_rate;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3" data-testid="rates-card">
      <div className="flex items-start gap-3">
        <Coins className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-sm text-slate-800">Tarifas por hora</p>
          <p className="text-[11px] text-slate-400">Aplican desde la semana del {fmtDate(data.week_start)} en adelante; las semanas pasadas conservan su tarifa.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">KGEN · $/hora</span>
          <input data-testid="rate-kgen-input" value={kgen} onChange={(e) => setKgen(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-amber-600 font-bold">BONO · $/hora</span>
          <input data-testid="rate-bonus-input" value={bonus} onChange={(e) => setBonus(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </label>
      </div>
      <button
        data-testid="rates-save-button"
        onClick={() => save.mutate()}
        disabled={!valid || !changed || save.isPending}
        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl py-2.5 active:scale-95 transition disabled:opacity-40"
      >
        <Save className="w-4 h-4" /> Guardar tarifas
      </button>

      <div className="border-t border-slate-100 pt-3">
        <button data-testid="rates-history-toggle" onClick={() => setShowHistory((s) => !s)} className="w-full flex items-center justify-between text-xs font-bold text-slate-600 py-1">
          <span className="flex items-center gap-1.5"><History className="w-4 h-4 text-slate-400" /> Historial de tarifas por semana</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? "rotate-180" : ""}`} />
        </button>
        {showHistory && (
          <div className="mt-2 space-y-1" data-testid="rates-history">
            {history.length === 0 && <p className="text-[11px] text-slate-400 text-center py-2">Aún no hay cambios de tarifa; aplican las tarifas por defecto.</p>}
            {history.map((h) => (
              <div key={h.week_start} className="flex items-center justify-between text-xs rounded-lg bg-slate-50 px-3 py-2" data-testid={`rates-history-row-${h.week_start}`}>
                <span className="font-semibold text-slate-600">Desde el {fmtDate(h.week_start)}</span>
                <span className="font-mono font-bold"><span className="text-emerald-600">KGEN {fmtMoney(h.kgen_rate)}</span> · <span className="text-amber-600">BONO {fmtMoney(h.bonus_rate)}</span></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
