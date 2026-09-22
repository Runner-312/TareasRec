import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Send, Check, BadgeDollarSign } from "lucide-react";
import { toast } from "sonner";
import api, { fmtDate, fmtMinutes } from "@/lib/api";
import { shiftWeek } from "@/lib/week";

function Toggle({ on, onClick, label, testId, activeCls }) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`flex items-center gap-1 text-[10px] font-bold rounded-lg px-2 py-1.5 active:scale-95 transition border ${on ? `${activeCls} text-white border-transparent` : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
    >
      <Check className={`w-3 h-3 ${on ? "" : "opacity-30"}`} strokeWidth={3} /> {label}
    </button>
  );
}

function Row({ item, week, onMark }) {
  const [amount, setAmount] = useState(item.amount ? String(item.amount) : "");
  const saveAmount = () => {
    const n = parseFloat(amount);
    if (!isNaN(n) && n !== item.amount) onMark({ worker_id: item.worker_id, amount: n });
  };
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2" data-testid={`extra-bonus-row-${item.worker_id}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-800 truncate">{item.name}</p>
          <p className="text-[11px] text-slate-400">{fmtMinutes(item.minutes)} esa semana{item.binance_pay_id ? ` · Binance ${item.binance_pay_id}` : ""}</p>
        </div>
        <span className={`text-[10px] font-bold rounded-md px-2 py-1 flex items-center gap-1 ${item.member_done ? "bg-violet-100 text-violet-700" : "bg-slate-200 text-slate-500"}`} data-testid={`extra-bonus-member-done-${item.worker_id}`}>
          <Send className="w-3 h-3" /> {item.member_done ? "Marcó Hecho" : "Sin marcar"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Toggle on={item.received} label="Captura recibida" testId={`extra-bonus-received-${item.worker_id}`} activeCls="bg-sky-500" onClick={() => onMark({ worker_id: item.worker_id, received: !item.received })} />
        <Toggle on={item.paid} label="Bono pagado" testId={`extra-bonus-paid-${item.worker_id}`} activeCls="bg-emerald-500" onClick={() => onMark({ worker_id: item.worker_id, paid: !item.paid })} />
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-bold">$</span>
          <input
            data-testid={`extra-bonus-amount-${item.worker_id}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            onBlur={saveAmount}
            placeholder="0.00"
            inputMode="decimal"
            className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}

export default function ExtraBonusCard() {
  const qc = useQueryClient();
  const [week, setWeek] = useState("");
  const { data } = useQuery({
    queryKey: ["extra-bonus", week],
    queryFn: () => api.get("/admin/extra-bonus", { params: { week_start: week || undefined } }).then((r) => r.data),
  });
  const mark = useMutation({
    mutationFn: (body) => api.post("/admin/extra-bonus", { ...body, week_start: data.week_start }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["extra-bonus"] }),
    onError: (e) => toast.error(e.response?.data?.detail || "No se pudo guardar"),
  });
  if (!data) return null;
  const items = data.items || [];
  const paidCount = items.filter((i) => i.paid).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3" data-testid="extra-bonus-card">
      <div className="flex items-start gap-3">
        <BadgeDollarSign className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-sm text-slate-800">Bono extra semanal (Telegram)</p>
          <p className="text-[11px] text-slate-400">Miembros con más de 5 h en la semana. Marca cuando recibas la captura y cuando pagues el bono.</p>
        </div>
      </div>
      <div className="flex items-center gap-1 bg-slate-50 rounded-xl px-2 py-1.5">
        <button data-testid="extra-bonus-prev-week" onClick={() => setWeek(shiftWeek(data.week_start, -1))} className="p-1.5 rounded-lg hover:bg-slate-100 active:scale-95 transition"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
        <span className="flex-1 text-center text-[11px] font-bold text-slate-600" data-testid="extra-bonus-week-label">Semana {fmtDate(data.week_start)} – {fmtDate(data.week_end)}</span>
        <button data-testid="extra-bonus-next-week" onClick={() => setWeek(shiftWeek(data.week_start, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 active:scale-95 transition"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3" data-testid="extra-bonus-empty">Nadie superó las 5 h esa semana.</p>
      ) : (
        <>
          <p className="text-[11px] text-slate-400 text-center" data-testid="extra-bonus-count">{items.length} elegible(s) · {paidCount} pagado(s)</p>
          <div className="space-y-2">{items.map((it) => <Row key={it.worker_id} item={it} week={data.week_start} onMark={mark.mutate} />)}</div>
        </>
      )}
    </div>
  );
}
