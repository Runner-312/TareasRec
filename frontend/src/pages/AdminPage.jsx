import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, LineChart as LineChartIcon, Trophy, Users, ClipboardList, LogOut, Video } from "lucide-react";
import { useAuth } from "@/App";
import OverviewTab from "@/components/admin/OverviewTab";
import StatsTab from "@/components/admin/StatsTab";
import RankingsTab from "@/components/admin/RankingsTab";
import WorkersTab from "@/components/admin/WorkersTab";
import EntriesTab from "@/components/admin/EntriesTab";

const TABS = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "grafico", label: "Gráfico", icon: LineChartIcon },
  { id: "rankings", label: "Rankings", icon: Trophy },
  { id: "empleadas", label: "Empleadas", icon: Users },
  { id: "registros", label: "Registros", icon: ClipboardList },
];

export default function AdminPage() {
  const [tab, setTab] = useState("resumen");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B132B]/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight" data-testid="admin-welcome">Hola, {user?.name}</p>
            <p className="text-slate-400 text-[11px] font-medium">Panel de Administrador</p>
          </div>
        </div>
        <button
          data-testid="admin-logout-button"
          onClick={() => { logout(); navigate("/login"); }}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-semibold bg-slate-800 rounded-xl px-3 py-2 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Salir
        </button>
      </header>

      <nav className="sticky top-[60px] z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-2 py-2 flex gap-1 overflow-x-auto" data-testid="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            data-testid={`admin-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              tab === t.id ? "bg-sky-500 text-white shadow-md shadow-sky-500/25" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </nav>

      <main className="max-w-md md:max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {tab === "resumen" && <OverviewTab />}
        {tab === "grafico" && <StatsTab />}
        {tab === "rankings" && <RankingsTab />}
        {tab === "empleadas" && <WorkersTab />}
        {tab === "registros" && <EntriesTab />}
      </main>
    </div>
  );
}
