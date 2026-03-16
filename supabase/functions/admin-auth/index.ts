import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function generateToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + Math.floor(Date.now() / 86400000));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyToken(req: Request, password: string): Promise<boolean> {
  const authToken = req.headers.get("x-admin-token");
  if (!authToken) return false;
  const expected = await generateToken(password);
  return authToken === expected;
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
    if (!ADMIN_PASSWORD) return json({ error: "Admin password not configured" }, 500);

    const body = await req.json();
    const { action } = body;

    // --- LOGIN ---
    if (action === "login") {
      if (body.password !== ADMIN_PASSWORD) return json({ error: "Неверный пароль" }, 401);
      const token = await generateToken(ADMIN_PASSWORD);
      return json({ success: true, token });
    }

    // --- VERIFY ---
    if (action === "verify") {
      if (!(await verifyToken(req, ADMIN_PASSWORD))) return json({ error: "Invalid token" }, 401);
      return json({ valid: true });
    }

    // --- ANALYTICS ---
    if (action === "analytics") {
      if (!(await verifyToken(req, ADMIN_PASSWORD))) return json({ error: "Unauthorized" }, 401);
      const supabase = getSupabaseAdmin();
      const [sessionsRes, usageRes] = await Promise.all([
        supabase.from("analytics_sessions").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("analytics_deck_usage").select("*").order("created_at", { ascending: false }).limit(500),
      ]);
      return json({ sessions: sessionsRes.data || [], deckUsage: usageRes.data || [] });
    }

    // --- GET DECKS ---
    if (action === "get_decks") {
      const supabase = getSupabaseAdmin();
      const { data: decks } = await supabase.from("decks").select("*").order("order");
      const { data: cards } = await supabase.from("deck_cards").select("*").order("order");
      return json({ decks: decks || [], cards: cards || [] });
    }

    // --- SAVE DECK (create or update) ---
    if (action === "save_deck") {
      if (!(await verifyToken(req, ADMIN_PASSWORD))) return json({ error: "Unauthorized" }, 401);
      const { deck } = body;
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("decks").upsert({
        id: deck.id,
        name: deck.name,
        card_back_url: deck.cardBack || null,
        order: deck.order,
        enabled_techniques: deck.enabledTechniques || [],
      });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    // --- DELETE DECK ---
    if (action === "delete_deck") {
      if (!(await verifyToken(req, ADMIN_PASSWORD))) return json({ error: "Unauthorized" }, 401);
      const { deckId } = body;
      const supabase = getSupabaseAdmin();
      
      // Delete storage files for this deck
      const { data: cards } = await supabase.from("deck_cards").select("image_url").eq("deck_id", deckId);
      if (cards && cards.length > 0) {
        const paths = cards.map(c => {
          const url = c.image_url;
          const match = url.match(/deck-assets\/(.+)$/);
          return match ? match[1] : null;
        }).filter(Boolean);
        if (paths.length > 0) await supabase.storage.from("deck-assets").remove(paths as string[]);
      }

      // Delete deck back if exists
      const { data: deckData } = await supabase.from("decks").select("card_back_url").eq("id", deckId).single();
      if (deckData?.card_back_url) {
        const match = deckData.card_back_url.match(/deck-assets\/(.+)$/);
        if (match) await supabase.storage.from("deck-assets").remove([match[1]]);
      }

      const { error } = await supabase.from("decks").delete().eq("id", deckId);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    // --- UPLOAD IMAGE ---
    if (action === "upload_image") {
      if (!(await verifyToken(req, ADMIN_PASSWORD))) return json({ error: "Unauthorized" }, 401);
      const { deckId, imageBase64, fileName, isCardBack } = body;
      const supabase = getSupabaseAdmin();

      // Decode base64
      const base64Data = imageBase64.split(",")[1] || imageBase64;
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

      const ext = fileName?.split(".").pop() || "jpg";
      const path = `${deckId}/${crypto.randomUUID()}.${ext}`;
      
      const contentType = imageBase64.startsWith("data:image/png") ? "image/png" :
                          imageBase64.startsWith("data:image/webp") ? "image/webp" : "image/jpeg";

      const { error: uploadErr } = await supabase.storage.from("deck-assets").upload(path, bytes, { contentType, upsert: true });
      if (uploadErr) return json({ error: uploadErr.message }, 500);

      const { data: publicUrl } = supabase.storage.from("deck-assets").getPublicUrl(path);
      const imageUrl = publicUrl.publicUrl;

      if (isCardBack) {
        await supabase.from("decks").update({ card_back_url: imageUrl }).eq("id", deckId);
      } else {
        const { data: existing } = await supabase.from("deck_cards").select("order").eq("deck_id", deckId).order("order", { ascending: false }).limit(1);
        const nextOrder = (existing && existing.length > 0) ? existing[0].order + 1 : 0;
        await supabase.from("deck_cards").insert({ deck_id: deckId, image_url: imageUrl, order: nextOrder });
      }

      return json({ success: true, imageUrl });
    }

    // --- DELETE CARD IMAGE ---
    if (action === "delete_card") {
      if (!(await verifyToken(req, ADMIN_PASSWORD))) return json({ error: "Unauthorized" }, 401);
      const { cardId, imageUrl } = body;
      const supabase = getSupabaseAdmin();

      // Delete from storage
      const match = imageUrl?.match(/deck-assets\/(.+)$/);
      if (match) await supabase.storage.from("deck-assets").remove([match[1]]);

      const { error } = await supabase.from("deck_cards").delete().eq("id", cardId);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
