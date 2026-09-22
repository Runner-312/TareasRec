import { fmtDate } from "@/lib/api";

const toneOf = (cycle) => {
  if (!cycle) return "none";
  if (cycle.status === "current") return "cycle";
  if (cycle.status === "future") return "future";
  return "past";
};

const rangeOf = (w) => `${fmtDate(w.start)} – ${fmtDate(w.end)}`;

const bonusState = (w) => {
  if (w.paid) return " Este bono ya fue pagado.";
  if (w.closed && !w.qualifies) return " Esa semana no se alcanzaron las 10 h, así que no hay bono.";
  return "";
};

const pastSuffix = (w) => {
  if (w.paid) return " · bono pagado";
  if (w.qualifies) return ` · bono se paga el martes ${fmtDate(w.bonus_payday)}`;
  return " · no se alcanzaron las 10 h";
};

export function describeDay(iso, weeks, minutes, reviewed, today) {
  const payKgen = weeks.find((w) => w.kgen_payday === iso);
  const payBonus = weeks.find((w) => w.bonus_payday === iso);
  const cycle = weeks.find((w) => iso >= w.start && iso <= w.end);
  const base = { tone: toneOf(cycle), minutes, reviewed, pop: null, upcoming: false };

  if (payKgen) {
    return { ...base, pop: "kgen", upcoming: iso >= today && !payKgen.paid, title: "Día de pago de KGEN", text: `Hoy KGEN paga a todo el equipo lo grabado la semana del ${rangeOf(payKgen)}.` };
  }
  if (payBonus) {
    return { ...base, pop: "bonus", upcoming: iso >= today && !payBonus.paid, title: "Día de pago del BONO", text: `Hoy se paga el bono de la semana del ${rangeOf(payBonus)}, para quienes superaron las 10 h.${bonusState(payBonus)}` };
  }
  if (!cycle) return { ...base, title: "Día sin actividad", text: "Este día no forma parte de ninguna semana registrada." };
  if (base.tone === "cycle") return { ...base, title: "Semana en curso", text: `Cuenta para la semana ${rangeOf(cycle)}.` };
  if (base.tone === "future") return { ...base, title: "Próxima semana", text: `Semana ${rangeOf(cycle)}. KGEN pagará el lunes ${fmtDate(cycle.kgen_payday)} y el bono el martes ${fmtDate(cycle.bonus_payday)}.` };
  return { ...base, title: "Semana pasada", text: `Semana ${rangeOf(cycle)}${pastSuffix(cycle)}.` };
}
