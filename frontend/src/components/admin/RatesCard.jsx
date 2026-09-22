import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coins, Save } from "lucide-react";
import { toast } from "sonner";
import api, { fmtDate } from "@/lib/api";

export default function RatesCard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["rates"], queryFn: () => api.get("/admin/rates").then((r) => r.data) });
  const [kgen, setKgen] = useState("");
  const [bonus, setBonus] = useState("");
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
    </div>
  );
}
