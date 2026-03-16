const TOKEN_KEY = "mac_admin_token";
const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`;

export function getAdminToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function adminFetch(body: Record<string, unknown>) {
  const token = getAdminToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["x-admin-token"] = token;
  const resp = await fetch(FUNCTIONS_URL, { method: "POST", headers, body: JSON.stringify(body) });
  return resp;
}

export async function loginAdmin(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const resp = await adminFetch({ action: "login", password });
    const data = await resp.json();
    if (!resp.ok) return { success: false, error: data.error || "Ошибка входа" };
    sessionStorage.setItem(TOKEN_KEY, data.token);
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка соединения" };
  }
}

export async function verifyAdminToken(): Promise<boolean> {
  if (!getAdminToken()) return false;
  try {
    const resp = await adminFetch({ action: "verify" });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function fetchAnalytics(): Promise<{ sessions: any[]; deckUsage: any[] } | null> {
  if (!getAdminToken()) return null;
  try {
    const resp = await adminFetch({ action: "analytics" });
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}

// --- Deck CRUD via admin edge function ---

export async function saveDeckToCloud(deck: { id: string; name: string; cardBack: string | null; order: number; enabledTechniques?: string[] }): Promise<boolean> {
  try {
    const resp = await adminFetch({ action: "save_deck", deck });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function deleteDeckFromCloud(deckId: string): Promise<boolean> {
  try {
    const resp = await adminFetch({ action: "delete_deck", deckId });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function uploadImageToCloud(deckId: string, imageBase64: string, fileName: string, isCardBack = false): Promise<string | null> {
  try {
    const resp = await adminFetch({ action: "upload_image", deckId, imageBase64, fileName, isCardBack });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.imageUrl;
  } catch {
    return null;
  }
}

export async function deleteCardFromCloud(cardId: string, imageUrl: string): Promise<boolean> {
  try {
    const resp = await adminFetch({ action: "delete_card", cardId, imageUrl });
    return resp.ok;
  } catch {
    return false;
  }
}
