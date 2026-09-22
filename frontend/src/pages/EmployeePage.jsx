import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { LogOut, Video, CalendarDays } from "lucide-react";
import { useAuth } from "@/App";
import api, { fmtDate } from "@/lib/api";
import PayCalendar from "@/components/PayCalendar";
import MyWeekChart from "@/components/MyWeekChart";
import ThemeToggle from "@/components/ThemeToggle";
import EntryForm from "@/components/member/EntryForm";
import SummaryCards from "@/components/member/SummaryCards";
import GoalCard from "@/components/member/GoalCard";
import RankSection from "@/components/member/RankSection";
import EntriesList from "@/components/member/EntriesList";
import MemberNotices from "@/components/member/MemberNotices";
import EarningsChart from "@/components/member/EarningsChart";
import Reminders from "@/components/member/Reminders";
import FlyingBills from "@/components/FlyingBills";
import { RankBadge, StreakBadge } from "@/components/Badges";

export default function EmployeePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["my-dashboard"],
    queryFn: () => api.get("/me/dashboard").then((r) => r.data),
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Cargando tu panel…</p>
      </div>
    );
  }

  const w = data.week;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 relative">
      <FlyingBills />
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B132B]/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm flex items-center gap-1.5 flex-wrap" data-testid="employee-welcome">
              ¡Hola, <span data-testid="employee-name" className={data.on_fire ? "fire fire-orange" : ""}>{data.name}</span>!
            </p>
            <div className="flex items-center gap-1 mt-0.5" data-testid="header-badges">
              <RankBadge type="weekly" rank={w.rank} />
              <RankBadge type="global" rank={data.global_rank} />
              <StreakBadge streak={data.streak} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            data-testid="employee-logout-button"
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-semibold bg-slate-800 rounded-xl px-3 py-2 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-8 relative z-10">
        <Reminders registeredToday={data.today.registered} weeklyReport={data.weekly_report} />

        <section className="fade-up">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reporte diario</h2>
          <p className="text-sm text-slate-500 mt-1">Elige el día, anota tus minutos y sube la captura como prueba. Si te equivocas, puedes borrar el reporte y enviarlo de nuevo.</p>
          <EntryForm days={data.days} dayMinutes={data.day_minutes} today={data.today_date} weekStart={w.start} weekEnd={w.end} />
        </section>

        <SummaryCards week={w} rates={data.rates} estimate={data.estimate} globalMinutes={data.global_minutes} historicalMinutes={data.historical_minutes} />
        <GoalCard week={w} userId={user?.id} todayISO={data.today_date} />
        <EarningsChart earnings={data.earnings} />
        <MemberNotices streak={data.streak} bestStreak={data.best_streak} binancePayId={data.binance_pay_id} walletAddress={data.usdt_bep20_address} />

        <section className="fade-up">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-sky-500" /> Calendario de pago
          </h2>
          <p className="text-sm text-slate-500 mb-3">
            Lo que grabes del <strong>miércoles {fmtDate(w.start)}</strong> al <strong>martes {fmtDate(w.end)}</strong>: KGEN paga el <strong className="text-emerald-600">lunes {fmtDate(w.kgen_payday)}</strong> y el bono (si superas 10 h) se paga el <strong className="text-amber-600">martes {fmtDate(w.payday)}</strong>. Toca cualquier día para ver qué significa.
          </p>
          <PayCalendar weeks={data.weeks} dayMinutes={data.day_minutes} dayReviewed={data.day_reviewed} currentWeekStart={w.start} />
        </section>

        <section className="fade-up bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Tus minutos de la semana</h2>
          <p className="text-xs text-slate-400 mb-3">Miércoles a martes · minutos registrados por día</p>
          <MyWeekChart days={data.days} />
        </section>

        <RankSection data={data} userId={user?.id} />

        <EntriesList entries={data.entries} weekStart={w.start} weekEnd={w.end} />
      </main>
    </div>
  );
}
