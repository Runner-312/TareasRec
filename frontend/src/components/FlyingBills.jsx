import { Banknote } from "lucide-react";

const BILLS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 7.3 + 3) % 100,
  delay: (i * 1.7) % 12,
  duration: 14 + (i % 5) * 3,
  size: 16 + (i % 4) * 6,
  drift: i % 2 === 0 ? 1 : -1,
}));

export default function FlyingBills() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true" data-testid="flying-bills-bg">
      {BILLS.map((b, i) => (
        <Banknote
          key={i}
          className="bill absolute text-emerald-500/20 dark:text-emerald-400/15"
          style={{ left: `${b.left}%`, width: b.size, height: b.size, animationDelay: `-${b.delay}s`, animationDuration: `${b.duration}s`, "--drift": b.drift }}
        />
      ))}
    </div>
  );
}
