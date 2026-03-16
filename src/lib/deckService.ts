import { supabase } from "@/integrations/supabase/client";
import type { Deck } from "@/types/mac";

export interface DeckCard {
  id: string;
  deck_id: string;
  image_url: string;
  order: number;
}

export async function loadDecksFromCloud(): Promise<Deck[]> {
  const { data: decksData } = await supabase.from("decks" as any).select("*").order("order");
  const { data: cardsData } = await supabase.from("deck_cards" as any).select("*").order("order");

  if (!decksData) return [];

  const cardsByDeck: Record<string, string[]> = {};
  (cardsData || []).forEach((card: any) => {
    if (!cardsByDeck[card.deck_id]) cardsByDeck[card.deck_id] = [];
    cardsByDeck[card.deck_id].push(card.image_url);
  });

  return (decksData as any[]).map((d: any) => ({
    id: d.id,
    name: d.name,
    images: cardsByDeck[d.id] || [],
    cardBack: d.card_back_url,
    order: d.order,
    enabledTechniques: d.enabled_techniques || [],
  }));
}

export async function loadDeckCards(deckId: string): Promise<DeckCard[]> {
  const { data } = await supabase.from("deck_cards" as any).select("*").eq("deck_id", deckId).order("order");
  return (data || []) as DeckCard[];
}
