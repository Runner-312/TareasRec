import { Trophy, Globe, Flame } from "lucide-react";

const RANK_STYLE = {
  1: "from-amber-300 to-amber-500 text-amber-950 shadow-amber-400/40",
  2: "from-slate-200 to-slate-400 text-slate-800 shadow-slate-300/40",
  3: "from-amber-600 to-amber-800 text-amber-50 shadow-amber-700/40",
};
const GRAY = "from-slate-500 to-slate-600 text-slate-100 shadow-none";

export function RankBadge({ type, rank, size = "sm" }) {
  if (!rank) return null;
  const Icon = type === "weekly" ? Trophy : Globe;
  const cls = RANK_STYLE[rank] || GRAY;
  const dim = size === "sm" ? "h-6 px-1.5 text-[10px]" : "h-7 px-2 text-xs";
  return (
    <span
      data-testid={`badge-${type}-rank`}
      data-rank={rank}
      title={`${type === "weekly" ? "Ranking semanal" : "Ranking global"}: #${rank}`}
      className={`inline-flex items-center gap-0.5 rounded-lg bg-gradient-to-br font-mono font-extrabold shadow-md ${cls} ${dim} ${rank <= 3 ? "badge-shine" : ""}`}
    >
      <Icon className="w-3 h-3" strokeWidth={2.5} />#{rank}
    </span>
  );
}

const STREAK_TIERS = [
  { min: 30, label: "30 días", cls: "from-fuchsia-500 to-rose-500 text-white shadow-rose-500/40" },
  { min: 14, label: "14 días", cls: "from-orange-400 to-red-500 text-white shadow-orange-500/40" },
  { min: 7, label: "7 días", cls: "from-amber-300 to-orange-500 text-amber-950 shadow-orange-400/40" },
];

export function StreakBadge({ streak, size = "sm" }) {
  const tier = STREAK_TIERS.find((t) => streak >= t.min);
  if (!tier) return null;
  const dim = size === "sm" ? "h-6 px-1.5 text-[10px]" : "h-7 px-2 text-xs";
  return (
    <span
      data-testid="badge-streak"
      data-tier={tier.min}
      title={`Racha de ${tier.label}`}
      className={`inline-flex items-center gap-0.5 rounded-lg bg-gradient-to-br font-extrabold shadow-md badge-shine ${tier.cls} ${dim}`}
    >
      <Flame className="w-3 h-3" strokeWidth={2.5} />{tier.min}
    </span>
  );
}

export const fireClass = (rank) => (rank === 1 ? "fire fire-orange" : rank === 2 ? "fire fire-blue" : rank === 3 ? "fire fire-green" : "");
