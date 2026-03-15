import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, password } = await req.json();
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
    
    if (!ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Admin password not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "login") {
      if (password !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Неверный пароль" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Generate a simple session token (hash of password + timestamp valid for 24h)
      const encoder = new TextEncoder();
      const data = encoder.encode(ADMIN_PASSWORD + Math.floor(Date.now() / 86400000));
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const token = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
      
      return new Response(JSON.stringify({ success: true, token }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      const encoder = new TextEncoder();
      const data = encoder.encode(ADMIN_PASSWORD + Math.floor(Date.now() / 86400000));
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const expectedToken = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
      
      const authToken = req.headers.get("x-admin-token");
      if (authToken !== expectedToken) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ valid: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "analytics") {
      // Verify admin token
      const encoder = new TextEncoder();
      const data = encoder.encode(ADMIN_PASSWORD + Math.floor(Date.now() / 86400000));
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const expectedToken = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
      
      const authToken = req.headers.get("x-admin-token");
      if (authToken !== expectedToken) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const [sessionsRes, usageRes] = await Promise.all([
        supabase.from("analytics_sessions").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("analytics_deck_usage").select("*").order("created_at", { ascending: false }).limit(500),
      ]);

      return new Response(JSON.stringify({
        sessions: sessionsRes.data || [],
        deckUsage: usageRes.data || [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
