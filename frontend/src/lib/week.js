export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function weekStartOf(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (x.getDay() - 3 + 7) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

export function currentWeekStartISO() {
  return toISODate(weekStartOf(new Date()));
}

export function shiftWeek(iso, weeks) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + weeks * 7);
  return toISODate(d);
}
