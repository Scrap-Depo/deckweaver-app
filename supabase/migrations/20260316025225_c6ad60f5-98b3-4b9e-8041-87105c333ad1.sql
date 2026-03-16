
-- Create decks table
CREATE TABLE public.decks (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT 'Новая колода',
  card_back_url text,
  "order" integer NOT NULL DEFAULT 0,
  enabled_techniques jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create deck_cards table
CREATE TABLE public.deck_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id text NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_cards ENABLE ROW LEVEL SECURITY;

-- Anyone can read decks
CREATE POLICY "Anyone can read decks" ON public.decks FOR SELECT TO anon, authenticated USING (true);

-- Anyone can read deck cards
CREATE POLICY "Anyone can read deck cards" ON public.deck_cards FOR SELECT TO anon, authenticated USING (true);

-- Create storage bucket for deck assets
INSERT INTO storage.buckets (id, name, public) VALUES ('deck-assets', 'deck-assets', true);

-- Allow public read on deck-assets
CREATE POLICY "Public read deck-assets" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'deck-assets');
