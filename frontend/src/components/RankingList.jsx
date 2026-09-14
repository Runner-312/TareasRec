import { fmtMinutes } from "@/lib/api";

const badgeStyle = (rank) => {
  if (rank === 1) return "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950";
  if (rank === 2) return "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800";
  if (rank === 3) return "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50";
  return "bg-slate-100 text-slate-500";
};

export default function RankingList({ items, testId, highlightId, emptyText = "Aún no hay minutos registrados" }) {
  const visible = (items || []).filter((i) => i.minutes > 0);
  return (
    <div data-testid={testId} className="space-y-2">
      {visible.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">{emptyText}</p>
      )}
      {visible.map((item) => (
        <div
          key={item.id}
          data-testid={`${testId}-row-${item.rank}`}
          className={`flex items-center gap-3 rounded-xl px-3 py-3 border transition-colors ${
            highlightId === item.id
              ? "bg-sky-50 border-sky-300"
              : "bg-white border-slate-100"
          }`}
        >
          <span
            className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${badgeStyle(item.rank)}`}
          >
            #{item.rank}
          </span>
          <span className="flex-1 font-semibold text-sm text-slate-800 truncate">
            {item.name}
            {highlightId === item.id && <span className="ml-2 text-xs text-sky-600 font-bold">(Tú)</span>}
          </span>
          <span className="font-mono text-sm font-bold text-sky-600">{fmtMinutes(item.minutes)}</span>
        </div>
      ))}
    </div>
  );
}
