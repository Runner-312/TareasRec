import RatesCard from "@/components/admin/RatesCard";
import AdminCodeCard from "@/components/admin/AdminCodeCard";

export default function SettingsTab() {
  return (
    <div className="space-y-5 fade-up" data-testid="settings-tab">
      <RatesCard />
      <AdminCodeCard />
    </div>
  );
}
