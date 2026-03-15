import { useState } from "react";
import { Lock, ArrowLeft, LogIn } from "lucide-react";
import { loginAdmin } from "@/lib/adminAuth";

interface AdminLoginProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function AdminLogin({ onSuccess, onBack }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await loginAdmin(password);
    setLoading(false);
    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "Ошибка");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 px-4 py-2 bg-secondary/30 rounded-xl hover:bg-secondary/50"
        >
          <ArrowLeft size={18} /> Назад
        </button>

        <div className="glass-surface p-10 text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={36} className="text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2">Панель администратора</h1>
          <p className="text-muted-foreground text-sm mb-8">Введите пароль для доступа</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-all text-center text-lg tracking-widest"
              autoFocus
            />
            {error && (
              <p className="text-destructive text-sm font-medium">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-primary hover:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground px-6 py-3 rounded-xl font-bold transition-all shadow-glow-primary flex items-center justify-center gap-2"
            >
              {loading ? "Проверка..." : <><LogIn size={18} /> Войти</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
