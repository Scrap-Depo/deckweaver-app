import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "mac_session_id";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function trackSession() {
  const sessionId = getSessionId();
  try {
    await supabase.from("analytics_sessions" as any).insert({
      session_id: sessionId,
      user_agent: navigator.userAgent,
    });
  } catch (e) {
    console.error("Analytics session track error:", e);
  }
}

export async function trackDeckUsage(deckName: string, techniqueName: string) {
  const sessionId = getSessionId();
  try {
    await supabase.from("analytics_deck_usage" as any).insert({
      session_id: sessionId,
      deck_name: deckName,
      technique_name: techniqueName,
    });
  } catch (e) {
    console.error("Analytics deck usage track error:", e);
  }
}
