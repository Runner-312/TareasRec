import { useEffect, useRef } from "react";
import { fmtMinutes } from "@/lib/api";
import { fireClass } from "@/components/Badges";

const badgeStyle = (rank) => {
  if (rank === 1) return "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950";
  if (rank === 2) return "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800";
  if (rank === 3) return "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50";
  return "bg-slate-100 text-slate-500";
};

const ROW_H = 56;
const MAX_VISIBLE = 4;

export default function RankingList({ items, testId, highlightId, emptyText = "Aún no hay minutos registrados" }) {
  const visible = (items || []).filter((i) => i.minutes > 0);
  const boxRef = useRef(null);
  const myRef = useRef(null);
  const scrollable = visible.length > MAX_VISIBLE;

  useEffect(() => {
    if (!scrollable || !boxRef.current || !myRef.current) return;
    const box = boxRef.current;
    const target = myRef.current.offsetTop - box.clientHeight / 2 + ROW_H / 2;
    box.scrollTop = Math.max(0, target);
  }, [scrollable, visible.length, highlightId]);

  return (
    <div className="relative">
      <div
        ref={boxRef}
        data-testid={testId}
        data-scrollable={scrollable ? "true" : undefined}
        className={`space-y-2 ${scrollable ? "overflow-y-auto pr-1" : ""}`}
        style={scrollable ? { maxHeight: MAX_VISIBLE * ROW_H + (MAX_VISIBLE - 1) * 8 } : undefined}
      >
        {visible.length === 0 && <p className="text-sm text-slate-400 text-center py-6">{emptyText}</p>}
        {visible.map((item) => {
          const me = highlightId === item.id;
          return (
            <div
              key={item.id}
              ref={me ? myRef : null}
              data-testid={`${testId}-row-${item.rank}`}
              style={{ minHeight: ROW_H }}
              className={`flex items-center gap-3 rounded-xl px-3 border transition-colors ${me ? "bg-sky-50 border-sky-300" : "bg-white border-slate-100"}`}
            >
              <span className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${badgeStyle(item.rank)}`}>#{item.rank}</span>
              <span className="flex-1 font-semibold text-sm text-slate-800 truncate">
                <span className={fireClass(item.rank)} data-testid={`${testId}-name-${item.rank}`}>{item.name}</span>
                {me && <span className="ml-2 text-xs text-sky-600 font-bold">(Tú)</span>}
              </span>
              <span className="font-mono text-sm font-bold text-sky-600">{fmtMinutes(item.minutes)}</span>
            </div>
          );
        })}
      </div>
      {scrollable && (
        <p className="text-[10px] text-slate-400 text-center mt-1.5" data-testid={`${testId}-more`}>
          {visible.length} miembros · desliza para ver todos
        </p>
      )}
    </div>
  );
}
