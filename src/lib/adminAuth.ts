const TOKEN_KEY = "mac_admin_token";
const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`;

export function getAdminToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function loginAdmin(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const resp = await fetch(FUNCTIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", password }),
    });
    const data = await resp.json();
    if (!resp.ok) return { success: false, error: data.error || "Ошибка входа" };
    sessionStorage.setItem(TOKEN_KEY, data.token);
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка соединения" };
  }
}

export async function verifyAdminToken(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const resp = await fetch(FUNCTIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ action: "verify" }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function fetchAnalytics(): Promise<{ sessions: any[]; deckUsage: any[] } | null> {
  const token = getAdminToken();
  if (!token) return null;
  try {
    const resp = await fetch(FUNCTIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ action: "analytics" }),
    });
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}
