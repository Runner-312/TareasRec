import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Flame, Wallet, Landmark, Send } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

function WalletNotice() {
  const qc = useQueryClient();
  const [addr, setAddr] = useState("");
  const valid = /^0x[0-9a-fA-F]{40}$/.test(addr);
  const save = useMutation({
    mutationFn: () => api.post("/me/wallet", { usdt_bep20_address: addr }),
    onSuccess: () => {
      toast.success("Dirección USDT guardada");
      qc.invalidateQueries({ queryKey: ["my-dashboard"] });
    },
    onError: (e) => toast.error(e.response?.data?.detail || "No se pudo guardar"),
  });

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5" data-testid="wallet-missing-notice">
      <div className="flex items-start gap-3">
        <Landmark className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm text-amber-800">Registra tu dirección USDT (red BEP20)</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Pega aquí tu dirección USDT de Binance Smart Chain (BEP20). Solo se registra una vez; si necesitas cambiarla, avísale a Wuilber.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          data-testid="wallet-address-input"
          value={addr}
          onChange={(e) => setAddr(e.target.value.trim())}
          placeholder="0x…"
          className="flex-1 min-w-0 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          data-testid="wallet-address-save-button"
          onClick={() => save.mutate()}
          disabled={!valid || save.isPending}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl px-3.5 transition-all disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" /> Enviar
        </button>
      </div>
      {addr && !valid && <p className="text-[11px] text-red-500" data-testid="wallet-address-error">Debe empezar por 0x y tener 42 caracteres.</p>}
    </div>
  );
}

export default function MemberNotices({ streak, binancePayId, walletAddress }) {
  return (
    <div className="space-y-3 fade-up">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3" data-testid="streak-card">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${streak > 0 ? "bg-orange-100" : "bg-slate-100"}`}>
          <Flame className={`w-6 h-6 ${streak > 0 ? "text-orange-500" : "text-slate-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Racha diaria</p>
          <p className="font-bold text-sm text-slate-800" data-testid="streak-value">
            {streak > 0 ? `${streak} ${streak === 1 ? "día seguido" : "días seguidos"} registrando` : "Sin racha activa"}
          </p>
          <p className="text-[11px] text-slate-400">
            {streak >= 7 ? "¡Imparable! Una semana completa sin fallar." : streak > 0 ? "Registra hoy para mantenerla viva." : "Registra tus minutos hoy y empieza una racha."}
          </p>
        </div>
      </div>

      {!binancePayId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3" data-testid="binance-missing-notice">
          <Wallet className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-amber-800">Falta tu Binance Pay ID</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Aún no tenemos tu Binance Pay ID para pagarte el bono. Envíaselo a Wuilber para que lo registre y tus pagos lleguen sin retrasos.
            </p>
          </div>
        </div>
      )}

      {!walletAddress && <WalletNotice />}
    </div>
  );
}
