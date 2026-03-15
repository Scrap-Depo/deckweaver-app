import { useState, useEffect } from "react";
import { ArrowLeft, Users, BarChart3, Clock, LogOut, RefreshCw } from "lucide-react";
import { fetchAnalytics, clearAdminToken } from "@/lib/adminAuth";

interface AdminDashboardProps {
  onBack: () => void;
  onLogout: () => void;
}

interface AnalyticsData {
  sessions: Array<{ id: string; session_id: string; user_agent: string; created_at: string }>;
  deckUsage: Array<{ id: string; session_id: string; deck_name: string; technique_name: string; created_at: string }>;
}

export function AdminDashboard({ onBack, onLogout }: AdminDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchAnalytics();
    setData(result as AnalyticsData | null);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleLogout = () => {
    clearAdminToken();
    onLogout();
  };

  // Compute stats
  const uniqueSessions = data ? new Set(data.sessions.map(s => s.session_id)).size : 0;
  const totalUsage = data?.deckUsage.length || 0;

  // Deck popularity
  const deckCounts: Record<string, number> = {};
  data?.deckUsage.forEach(u => {
    deckCounts[u.deck_name] = (deckCounts[u.deck_name] || 0) + 1;
  });
  const sortedDecks = Object.entries(deckCounts).sort((a, b) => b[1] - a[1]);

  // Technique popularity
  const techCounts: Record<string, number> = {};
  data?.deckUsage.forEach(u => {
    techCounts[u.technique_name] = (techCounts[u.technique_name] || 0) + 1;
  });
  const sortedTechs = Object.entries(techCounts).sort((a, b) => b[1] - a[1]);

  // Recent sessions
  const recentSessions = data?.sessions.slice(0, 20) || [];

  // Sessions by day (last 7 days)
  const last7Days: Record<string, number> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    last7Days[d.toISOString().split("T")[0]] = 0;
  }
  data?.sessions.forEach(s => {
    const day = s.created_at.split("T")[0];
    if (day in last7Days) last7Days[day]++;
  });

  const maxDayCount = Math.max(...Object.values(last7Days), 1);

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground">Панель администратора</h1>
            <p className="text-sm text-muted-foreground">Аналитика и статистика</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} disabled={loading} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-colors">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl text-sm font-semibold transition-colors">
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">Загрузка аналитики...</div>
      ) : !data ? (
        <div className="text-center text-destructive py-20">Ошибка загрузки данных</div>
      ) : (
        <div className="space-y-8">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-surface p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users size={20} className="text-primary" />
                <span className="text-sm text-muted-foreground font-medium">Уникальных посетителей</span>
              </div>
              <p className="text-4xl font-black text-foreground">{uniqueSessions}</p>
            </div>
            <div className="glass-surface p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 size={20} className="text-primary" />
                <span className="text-sm text-muted-foreground font-medium">Сессий с колодами</span>
              </div>
              <p className="text-4xl font-black text-foreground">{totalUsage}</p>
            </div>
            <div className="glass-surface p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock size={20} className="text-primary" />
                <span className="text-sm text-muted-foreground font-medium">Последний визит</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {recentSessions[0] ? new Date(recentSessions[0].created_at).toLocaleString("ru-RU") : "—"}
              </p>
            </div>
          </div>

          {/* Activity chart (simple bar chart) */}
          <div className="glass-surface p-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Посещения за 7 дней</h3>
            <div className="flex items-end gap-2 h-32">
              {Object.entries(last7Days).map(([day, count]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">{count}</span>
                  <div
                    className="w-full bg-primary/60 rounded-t-lg transition-all min-h-[4px]"
                    style={{ height: `${(count / maxDayCount) * 100}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(day).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular decks & techniques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-surface p-6">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Популярные колоды</h3>
              {sortedDecks.length === 0 ? (
                <p className="text-muted-foreground text-sm">Пока нет данных</p>
              ) : (
                <div className="space-y-3">
                  {sortedDecks.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-foreground font-medium truncate">{name}</span>
                      <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-full text-sm">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="glass-surface p-6">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Популярные техники</h3>
              {sortedTechs.length === 0 ? (
                <p className="text-muted-foreground text-sm">Пока нет данных</p>
              ) : (
                <div className="space-y-3">
                  {sortedTechs.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-foreground font-medium truncate">{name}</span>
                      <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-full text-sm">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent visitors */}
          <div className="glass-surface p-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Последние посетители</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 text-muted-foreground font-medium">Время</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Устройство</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map(s => (
                    <tr key={s.id} className="border-b border-border/10">
                      <td className="py-2 text-foreground">{new Date(s.created_at).toLocaleString("ru-RU")}</td>
                      <td className="py-2 text-muted-foreground truncate max-w-[400px]">{parseUA(s.user_agent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function parseUA(ua: string): string {
  if (!ua) return "Неизвестно";
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Mac")) return "Mac";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Linux")) return "Linux";
  return "Браузер";
}
