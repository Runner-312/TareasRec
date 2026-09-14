import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { LogOut, Video, Camera, Clock, Wallet, Target, Trophy, CalendarDays, CheckCircle2, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/App";
import api, { fileUrl, fmtMoney, fmtMinutes, fmtDate } from "@/lib/api";
import RankingList from "@/components/RankingList";
import PayCalendar from "@/components/PayCalendar";
import MyWeekChart from "@/components/MyWeekChart";

export default function EmployeePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [minutes, setMinutes] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-dashboard"],
    queryFn: () => api.get("/me/dashboard").then((r) => r.data),
  });

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    const m = parseInt(minutes, 10);
    if (!m || m <= 0) {
      toast.error("Ingresa los minutos grabados hoy");
      return;
    }
    if (!file) {
      toast.error("Sube la captura de pantalla como prueba");
      return;
    }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("minutes", String(m));
      fd.append("screenshot", file);
      await api.post("/entries", fd);
      toast.success("¡Registro guardado! Ya no puedes modificarlo.");
      setMinutes("");
      setFile(null);
      setPreview(null);
      qc.invalidateQueries({ queryKey: ["my-dashboard"] });
    } catch (e) {
      toast.error(e.response?.data?.detail || "No se pudo guardar el registro");
    } finally {
      setSending(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Cargando tu panel…</p>
      </div>
    );
  }

  const w = data.week;
  const progress = Math.min(100, Math.round((w.minutes / w.goal_minutes) * 100));
  const remH = Math.floor(w.remaining_minutes / 60);
  const remM = w.remaining_minutes % 60;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B132B]/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <p className="text-white font-bold text-sm" data-testid="employee-welcome">¡Hola, {data.name}!</p>
        </div>
        <button
          data-testid="employee-logout-button"
          onClick={() => { logout(); navigate("/login"); }}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-semibold bg-slate-800 rounded-xl px-3 py-2 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Salir
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-8">
        <section className="fade-up">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Registrar minutos de hoy</h2>
          <p className="text-sm text-slate-500 mt-1">Anota tus minutos y sube la captura como prueba. Una vez guardado, no se puede modificar.</p>

          {data.today.registered ? (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3" data-testid="today-registered-card">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-sm text-emerald-800">Ya registraste {fmtMinutes(data.today.minutes)} hoy</p>
                <p className="text-xs text-emerald-600">Tu registro quedó guardado y visible para el administrador.</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Minutos grabados hoy</label>
                <input
                  data-testid="employee-minutes-input"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Ej. 95"
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="hidden" data-testid="screenshot-upload-input" />
              <button
                data-testid="screenshot-picker-button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-sky-300 rounded-xl py-6 flex flex-col items-center gap-2 text-sky-600 hover:bg-sky-50 transition-colors"
              >
                {preview ? (
                  <img src={preview} alt="captura" className="w-full max-h-48 object-contain rounded-lg" />
                ) : (
                  <>
                    <Camera className="w-7 h-7" />
                    <span className="text-xs font-bold">Subir captura de pantalla</span>
                  </>
                )}
              </button>
              <button
                data-testid="submit-minutes-button"
                onClick={submit}
                disabled={sending}
                className="w-full bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold rounded-xl py-3.5 shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
              >
                {sending ? "Guardando…" : "Guardar registro del día"}
              </button>
            </div>
          )}
        </section>

        <section className="fade-up">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">Tus horas y tu saldo</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0B132B] rounded-2xl p-4" data-testid="employee-hours-card">
              <Clock className="w-5 h-5 text-sky-400 mb-2" />
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Horas esta semana</p>
              <p className="font-mono text-xl font-bold text-sky-400">{w.hours} h</p>
              <p className="text-[11px] text-slate-500">{fmtMinutes(w.minutes)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm" data-testid="employee-balance-card">
              <Wallet className="w-5 h-5 text-emerald-500 mb-2" />
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Saldo a cobrar</p>
              <p className="font-mono text-xl font-bold text-emerald-600">{fmtMoney(w.estimated_total)}</p>
              <p className="text-[11px] text-slate-400">
                {w.qualifies
                  ? w.bonus > 0
                    ? `Base ${fmtMoney(w.base)} + bono ${fmtMoney(w.bonus)}`
                    : `${w.hours} h × $0.30`
                  : "Se activa al superar 10 h"}
              </p>
            </div>
          </div>
        </section>

        <section className="fade-up bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Tus minutos de la semana</h2>
          <p className="text-xs text-slate-400 mb-3">Miércoles a martes · minutos registrados por día</p>
          <MyWeekChart days={data.days} />
        </section>

        <section className="fade-up bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-500" /> Meta semanal: 10 horas
          </h2>
          <div className="mt-4 h-3.5 bg-slate-100 rounded-full overflow-hidden" data-testid="goal-progress-bar">
            <div
              className={`h-full rounded-full transition-all duration-700 ${w.qualifies ? "bg-emerald-500" : "bg-sky-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs font-bold text-slate-500 mt-2 text-right">{progress}%</p>
          {w.qualifies ? (
            <div className="mt-3 flex items-start gap-2.5 bg-emerald-50 rounded-xl p-3.5" data-testid="motivation-success">
              <PartyPopper className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-emerald-800">
                ¡Felicidades, {data.name}! Superaste las 10 horas esta semana. Tu pago está activado{w.bonus_pct > 0 ? ` y llevas un bono del ${Math.round(w.bonus_pct * 100)}% por tu puesto en el ranking` : ""}. ¡Sigue así!
              </p>
            </div>
          ) : (
            <div className="mt-3 flex items-start gap-2.5 bg-sky-50 rounded-xl p-3.5" data-testid="motivation-pending">
              <Target className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-sky-800">
                ¡Vas muy bien, {data.name}! Te {remH > 0 || remM > 0 ? `faltan ${remH > 0 ? `${remH} h ` : ""}${remM} min` : "falta muy poco"} para alcanzar las 10 horas y activar tu pago del lunes. ¡Tú puedes lograrlo!
              </p>
            </div>
          )}
        </section>

        <section className="fade-up">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Tu posición
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center" data-testid="my-weekly-rank">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Ranking semanal</p>
              <p className="font-mono text-3xl font-extrabold text-sky-600">{w.rank ? `#${w.rank}` : "—"}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center" data-testid="my-global-rank">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Ranking global</p>
              <p className="font-mono text-3xl font-extrabold text-slate-800">{data.global_rank ? `#${data.global_rank}` : "—"}</p>
            </div>
          </div>
          <h3 className="text-sm font-bold text-slate-700 mb-2">Ranking de la semana</h3>
          <RankingList items={data.weekly} testId="employee-weekly-ranking" highlightId={user?.id} />
          <h3 className="text-sm font-bold text-slate-700 mt-5 mb-2">Ranking global</h3>
          <RankingList items={data.global} testId="employee-global-ranking" highlightId={user?.id} />
        </section>

        <section className="fade-up">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-sky-500" /> Calendario de pago
          </h2>
          <p className="text-sm text-slate-500 mb-3">
            Lo que grabes del <strong>miércoles {fmtDate(w.start)}</strong> al <strong>martes {fmtDate(w.end)}</strong> se paga el <strong className="text-amber-600">lunes {fmtDate(w.payday)}</strong>.
          </p>
          <PayCalendar weekStart={w.start} weekEnd={w.end} payday={w.payday} />
        </section>

        <section className="fade-up">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">Tus últimos registros</h2>
          {data.entries.length === 0 ? (
            <p className="text-sm text-slate-400 bg-white rounded-2xl border border-slate-100 p-5 text-center">Aún no tienes registros.</p>
          ) : (
            <div className="space-y-2" data-testid="my-entries-list">
              {data.entries.map((e) => (
                <div key={e.id} className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex items-center gap-3">
                  <img src={fileUrl(e.screenshot_path)} alt="captura" className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-800 capitalize">{fmtDate(e.date)}</p>
                    <p className="text-[11px] text-slate-400">Registro verificado</p>
                  </div>
                  <span className="font-mono font-bold text-sky-600 text-sm">{fmtMinutes(e.minutes)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
