import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { fmtMoney } from "@/lib/api";

const VIEWS = [
  { key: "kgen", title: "Pagos de KGEN", sub: "Lo que cobras cada lunes", color: "#10B981", grid: "#D1FAE5" },
  { key: "bonus", title: "Pagos del BONO", sub: "Lo que cobras cada martes", color: "#F59E0B", grid: "#FDE68A" },
];
const MARGIN = { top: 8, right: 8, left: -14, bottom: 0 };
const X_TICK = { fontSize: 11, fill: "#64748B" };
const Y_TICK = { fontSize: 11, fill: "#94A3B8" };
const TOOLTIP_STYLE = { background: "#0B132B", border: "none", borderRadius: 12, fontSize: 12, color: "#fff" };
const ITEM_STYLE = { padding: 0, color: "#fff" };
const fmtAxis = (n) => `$${n}`;

export default function EarningsChart({ earnings }) {
  const [i, setI] = useState(0);
  const v = VIEWS[i];
  const data = (earnings || []).map((e) => ({ label: e.label, value: e[v.key], paid: e.paid, current: e.current }));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <section className="fade-up bg-white rounded-2xl border border-slate-100 shadow-sm p-5" data-testid="earnings-chart" data-view={v.key}>
      <div className="flex items-center justify-between mb-1">
        <button data-testid="earnings-prev" onClick={() => setI((i + 1) % 2)} className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900" style={{ color: v.color }} data-testid="earnings-title">{v.title}</h2>
          <p className="text-xs text-slate-400">{v.sub} · total {fmtMoney(total)}</p>
        </div>
        <button data-testid="earnings-next" onClick={() => setI((i + 1) % 2)} className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
      </div>
      <div className="flex justify-center gap-1.5 mb-2">
        {VIEWS.map((x, k) => <span key={x.key} className={`w-1.5 h-1.5 rounded-full ${k === i ? "" : "bg-slate-200"}`} style={k === i ? { background: x.color } : undefined} />)}
      </div>
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={MARGIN}>
            <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={X_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={Y_TICK} axisLine={false} tickLine={false} tickFormatter={fmtAxis} />
            <Tooltip
              formatter={(val, _n, p) => [`${fmtMoney(val)}${p.payload.paid ? " · pagado" : p.payload.current ? " · en curso" : ""}`, v.title]}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: v.color, fontWeight: 700 }}
              itemStyle={ITEM_STYLE}
            />
            <Line type="monotone" dataKey="value" stroke={v.color} strokeWidth={3} dot={{ r: 4, fill: v.color, strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
