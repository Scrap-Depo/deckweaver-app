
-- Analytics: anonymous sessions
CREATE TABLE public.analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analytics: deck usage
CREATE TABLE public.analytics_deck_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  deck_name TEXT NOT NULL,
  technique_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_deck_usage ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (no auth needed for tracking)
CREATE POLICY "Anyone can insert sessions" ON public.analytics_sessions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can insert deck usage" ON public.analytics_deck_usage
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only authenticated users can read (admin will read via edge function with service role)
CREATE POLICY "Authenticated can read sessions" ON public.analytics_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read deck usage" ON public.analytics_deck_usage
  FOR SELECT TO authenticated USING (true);
