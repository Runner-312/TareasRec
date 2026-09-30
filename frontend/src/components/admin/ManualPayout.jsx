import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Download, Trash2, Users, X, Landmark } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const STORAGE_KEY = "manual_payout_rows";
const TYPES = ["Binance ID (BUID)", "Binance Registered Email"];
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const inputCls = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400";

function AddForm({ onAdd }) {
  const [type, setType] = useState(TYPES[0]);
  const [account, setAccount] = useState("");
  const [currency, setCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const isEmail = type === TYPES[1];
  const valid = account.trim() && parseFloat(amount) > 0 && currency.trim() && (!isEmail || /\S+@\S+\.\S+/.test(account.trim()));

  const submit = () => {
    onAdd({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, account_type: type, account: account.trim(), currency: currency.trim().toUpperCase(), amount: Math.round(parseFloat(amount) * 100) / 100 });
    setAccount("");
    setAmount("");
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-3" data-testid="manual-payout-form">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Tipo de cuenta</span>
          <select data-testid="manual-payout-type" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{isEmail ? "Correo del destinatario" : "Binance ID (BUID)"}</span>
          <input data-testid="manual-payout-account" value={account} onChange={(e) => setAccount(e.target.value)} placeholder={isEmail ? "correo@ejemplo.com" : "Ej. 553311224"} inputMode={isEmail ? "email" : "numeric"} className={`${inputCls} font-mono`} />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Moneda</span>
          <input data-testid="manual-payout-currency" value={currency} onChange={(e) => setCurrency(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 10))} className={`${inputCls} font-mono uppercase`} />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Monto</span>
          <input data-testid="manual-payout-amount" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0.00" inputMode="decimal" className={`${inputCls} font-mono`} />
        </label>
      </div>
      <button data-testid="manual-payout-add" onClick={submit} disabled={!valid} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl px-4 py-2.5 active:scale-95 transition disabled:opacity-40">
        <Plus className="w-4 h-4" strokeWidth={3} /> Agregar
      </button>
    </div>
  );
}

export default function ManualPayout() {
  const [rows, setRows] = useState(load);
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)), [rows]);

  const { data: preview } = useQuery({ queryKey: ["payout-preview"], queryFn: () => api.get("/admin/payments/export").then((r) => r.data) });
  const total = Math.round(rows.reduce((s, r) => s + r.amount, 0) * 100) / 100;
  const currencies = [...new Set(rows.map((r) => r.currency))];

  const download = useMutation({
    mutationFn: () => api.post("/admin/payments/custom.xlsx", { rows: rows.map(({ id, ...r }) => r) }, { responseType: "blob" }),
    onSuccess: (res) => {
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `binance_pay_manual_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Plantilla descargada. Súbela en Binance Pay → Enviar a varios.");
    },
    onError: async (e) => {
      let msg = "No se pudo generar el Excel";
      try { msg = JSON.parse(await e.response.data.text()).detail || msg; } catch {}
      toast.error(msg);
    },
  });

  const loadPending = () => {
    const ready = (preview?.rows || []).filter((r) => r.ready);
    if (!ready.length) return toast.info("No hay pagos pendientes listos para cargar");
    const existing = new Set(rows.map((r) => r.account));
    const added = ready.filter((r) => !existing.has(r.binance_pay_id)).map((r) => ({ id: `p-${r.worker_id}`, account_type: TYPES[0], account: r.binance_pay_id, currency: preview.currency, amount: r.total, note: r.name }));
    setRows((prev) => [...prev, ...added]);
    toast.success(`${added.length} destinatario(s) cargado(s) desde pagos pendientes`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-4" data-testid="manual-payout-card">
      <div className="flex items-start gap-3">
        <Landmark className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-sm text-slate-800">Pagos múltiples · Binance Pay</p>
          <p className="text-[11px] text-slate-400">Agrega los destinatarios y descarga la plantilla de Binance ya rellenada (máx. 250). Los datos se guardan en este dispositivo.</p>
        </div>
      </div>

      <AddForm onAdd={(r) => setRows((prev) => (prev.length >= 250 ? prev : [...prev, r]))} />

      <div className="rounded-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 text-xs">
          <span className="font-semibold text-slate-600"><strong className="text-slate-900" data-testid="manual-payout-count">{rows.length}</strong> destinatarios</span>
          <span className="font-semibold text-slate-600">Total: <strong className="font-mono text-slate-900" data-testid="manual-payout-total">{total}</strong> {currencies.length === 1 ? currencies[0] : currencies.length ? "mixto" : "USDT"}</span>
        </div>
        <div className="grid grid-cols-[1.5rem_1fr_1.4fr_3rem_4rem_1.5rem] gap-1 bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          <span>#</span><span>Tipo</span><span>ID / correo</span><span>Mon.</span><span className="text-right">Monto</span><span />
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6" data-testid="manual-payout-empty">Aún no hay destinatarios. Agrega el primero arriba.</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto" data-testid="manual-payout-rows">
            {rows.map((r, i) => (
              <div key={r.id} data-testid={`manual-payout-row-${i + 1}`} className="grid grid-cols-[1.5rem_1fr_1.4fr_3rem_4rem_1.5rem] gap-1 items-center px-3 py-2 text-xs">
                <span className="text-slate-400 font-mono">{i + 1}</span>
                <span className="text-slate-600 truncate">{r.account_type === TYPES[0] ? "BUID" : "Correo"}</span>
                <span className="font-mono font-bold text-slate-800 truncate" title={r.note || r.account}>{r.account}</span>
                <span className="text-slate-600 font-mono">{r.currency}</span>
                <span className="text-right font-mono font-bold text-slate-900">{r.amount.toFixed(2)}</span>
                <button data-testid={`manual-payout-remove-${i + 1}`} onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))} className="p-1 rounded-md hover:bg-red-50 active:scale-95 transition" aria-label="Quitar">
                  <X className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button data-testid="manual-payout-load-pending" onClick={loadPending} className="flex items-center justify-center gap-1.5 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-bold rounded-xl px-4 py-2.5 active:scale-95 transition">
          <Users className="w-4 h-4" /> Cargar pagos pendientes
        </button>
        <button data-testid="manual-payout-download" onClick={() => download.mutate()} disabled={!rows.length || download.isPending} className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl px-4 py-2.5 active:scale-95 transition disabled:opacity-40">
          <Download className="w-4 h-4" /> {download.isPending ? "Generando…" : "Descargar plantilla Excel"}
        </button>
        <button data-testid="manual-payout-clear" onClick={() => setConfirmClear(true)} disabled={!rows.length} className="flex items-center justify-center gap-1.5 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold rounded-xl px-4 py-2.5 active:scale-95 transition disabled:opacity-40">
          <Trash2 className="w-4 h-4" /> Borrar todos los datos
        </button>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar todos los destinatarios?</AlertDialogTitle>
            <AlertDialogDescription>Se vaciará la lista de {rows.length} destinatario(s). Esta acción no afecta los pagos registrados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="manual-payout-clear-cancel">Cancelar</AlertDialogCancel>
            <AlertDialogAction data-testid="manual-payout-clear-confirm" onClick={() => setRows([])} className="bg-red-500 hover:bg-red-600">Borrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
