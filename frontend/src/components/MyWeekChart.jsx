import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const MARGIN = { top: 8, right: 8, left: -18, bottom: 0 };

export default function MyWeekChart({ days }) {
  const data = (days || []).map((d) => ({ day: d.label, Minutos: d.total }));
  return (
    <div data-testid="member-week-chart" className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={MARGIN}>
          <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            formatter={(v) => [`${v} min`, "Minutos"]}
            contentStyle={{ background: "#0B132B", border: "none", borderRadius: 12, fontSize: 12, color: "#fff" }}
            labelStyle={{ color: "#38BDF8", fontWeight: 700 }}
            itemStyle={{ padding: 0 }}
          />
          <Line type="monotone" dataKey="Minutos" stroke="#0EA5E9" strokeWidth={3} dot={{ r: 4, fill: "#0EA5E9", strokeWidth: 0 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
