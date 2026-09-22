import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, LayoutDashboard, LineChart as LineChartIcon, LogOut, Settings, Trophy, Users, Video } from "lucide-react";
import { useAuth } from "@/App";
import ThemeToggle from "@/components/ThemeToggle";
import FlyingBills from "@/components/FlyingBills";
import OverviewTab from "@/components/admin/OverviewTab";
import StatsTab from "@/components/admin/StatsTab";
import RankingsTab from "@/components/admin/RankingsTab";
import WorkersTab from "@/components/admin/WorkersTab";
import EntriesTab from "@/components/admin/EntriesTab";
import SettingsTab from "@/components/admin/SettingsTab";

const TABS = [
  { id: "resumen", label: "Resumen", mobileLabel: "Inicio", title: "Resumen general", description: "Pagos, actividad y próximos pasos", icon: LayoutDashboard },
  { id: "grafico", label: "Semana", mobileLabel: "Semana", title: "Rendimiento semanal", description: "Horas, progreso y detalle por miembro", icon: LineChartIcon },
  { id: "rankings", label: "Rankings", mobileLabel: "Ranking", title: "Clasificación", description: "Posiciones semanales y globales", icon: Trophy },
  { id: "miembros", label: "Miembros", mobileLabel: "Equipo", title: "Equipo", description: "Accesos y datos de cada miembro", icon: Users },
  { id: "registros", label: "Registros", mobileLabel: "Registros", title: "Registros diarios", description: "Revisa capturas y valida el trabajo", icon: ClipboardList },
  { id: "ajustes", label: "Ajustes", mobileLabel: "Ajustes", title: "Ajustes", description: "Tarifas por hora, historial y código de acceso", icon: Settings },
];

export default function AdminPage() {
  const [tab, setTab] = useState("resumen");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const activeTab = TABS.find((item) => item.id === tab) || TABS[0];

  const signOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative">
      <FlyingBills />

      <header className="sticky top-0 z-50 bg-[#0B132B]/95 border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-sm leading-tight truncate" data-testid="admin-welcome">Hola, {user?.name}</p>
                <span className="hidden sm:inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-300">Admin</span>
              </div>
              <p className="text-slate-400 text-[11px] font-medium">TareasREC · Panel de control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              data-testid="admin-logout-button"
              onClick={signOut}
              aria-label="Cerrar sesión"
              className="h-9 flex items-center gap-2 text-slate-300 hover:text-white text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-xl px-2.5 sm:px-3 transition-colors"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="hidden sm:block sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200" data-testid="admin-tabs" aria-label="Secciones del panel">
        <div className="max-w-6xl mx-auto px-6 py-2 flex gap-1">
          {TABS.map((item) => (
            <TabButton key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} />
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 sm:pb-10 relative z-10">
        <div className="mb-5 sm:mb-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600">Panel de administración</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{activeTab.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{activeTab.description}</p>
        </div>

        {tab === "resumen" && <OverviewTab />}
        {tab === "grafico" && <StatsTab />}
        {tab === "rankings" && <RankingsTab />}
        {tab === "miembros" && <WorkersTab />}
        {tab === "registros" && <EntriesTab />}
        {tab === "ajustes" && <SettingsTab />}
      </main>

      <nav className="mobile-admin-nav sm:hidden fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-xl px-1.5 pt-2" data-testid="admin-tabs-mobile" aria-label="Secciones del panel">
        <div className="grid grid-cols-5 gap-0.5">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`admin-tab-${item.id}-mobile`}
                onClick={() => setTab(item.id)}
                aria-current={active ? "page" : undefined}
                className={`min-w-0 rounded-xl py-1.5 flex flex-col items-center gap-1 text-[9px] font-bold transition-colors ${active ? "bg-sky-50 text-sky-600" : "text-slate-500"}`}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span className="truncate w-full px-0.5">{item.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function TabButton({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      data-testid={`admin-tab-${item.id}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
        active ? "bg-sky-500 text-white shadow-md shadow-sky-500/20" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
      }`}
    >
      <Icon className="w-4 h-4" /> {item.label}
    </button>
  );
}
