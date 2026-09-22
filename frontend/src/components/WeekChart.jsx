import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const MARGIN = { top: 8, right: 8, left: -18, bottom: 0 };

const PALETTE = [
  "#94A3B8", "#F59E0B", "#10B981", "#F472B6", "#A78BFA", "#FB7185",
  "#34D399", "#FBBF24", "#60A5FA", "#F97316", "#2DD4BF", "#E879F9",
  "#A3E635", "#FCA5A5", "#93C5FD", "#FCD34D",
];

export default function WeekChart({ days, workers }) {
  const data = (days || []).map((d, i) => {
    const row = { day: d.label, Equipo: d.total };
    (workers || []).forEach((w) => {
      row[w.name] = w.data[i];
    });
    return row;
  });

  return (
    <div data-testid="minimalist-line-chart" className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={MARGIN}>
          <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#0B132B",
              border: "none",
              borderRadius: 12,
              fontSize: 12,
              color: "#fff",
            }}
            labelStyle={{ color: "#38BDF8", fontWeight: 700 }}
            itemStyle={{ padding: 0 }}
          />
          {(workers || []).map((w, i) => (
            <Line
              key={w.id}
              type="monotone"
              dataKey={w.name}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={1.5}
              dot={false}
              opacity={0.55}
            />
          ))}
          <Line
            type="monotone"
            dataKey="Equipo"
            stroke="#0EA5E9"
            strokeWidth={3}
            dot={{ r: 4, fill: "#0EA5E9", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
