import { useState, useEffect } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { getAllDecksFromDB, saveDeckToDB, deleteDeckFromDB } from '@/lib/db';
import { TechniqueList } from '@/components/TechniqueList';
import { DeckList } from '@/components/DeckList';
import { DeckManager } from '@/components/DeckManager';
import { GuidedSession } from '@/components/GuidedSession';
import type { Deck, Technique } from '@/types/mac';

type ViewMode = 'techniques' | 'decks' | 'admin-decks' | 'manage-deck' | 'session';

const Index = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('techniques');
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedDecks = await getAllDecksFromDB();
        setDecks(storedDecks.sort((a, b) => a.order - b.order));
      } catch (e) {
        console.error("Ошибка загрузки БД:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const currentDeck = decks.find(d => d.id === currentDeckId);

  const handleAddNewDeck = async () => {
    if (decks.length >= 6) return;
    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      name: `Колода ${decks.length + 1}`,
      images: [],
      cardBack: null,
      order: decks.length,
      enabledTechniques: []
    };
    await saveDeckToDB(newDeck);
    setDecks([...decks, newDeck]);
  };

  const updateDeck = async (updatedDeck: Deck) => {
    await saveDeckToDB(updatedDeck);
    setDecks(decks.map(d => d.id === updatedDeck.id ? updatedDeck : d));
  };

  const handleDeleteDeck = async (id: string) => {
    await deleteDeckFromDB(id);
    setDecks(decks.filter(d => d.id !== id));
    setCurrentDeckId(null);
    setViewMode(viewMode === 'manage-deck' ? 'admin-decks' : 'techniques');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="size-full min-h-screen font-sans text-foreground selection:bg-primary/30 relative overflow-x-hidden">
      {/* Admin toggle */}
      <button
        onClick={() => setIsAdmin(!isAdmin)}
        className="fixed top-6 right-6 z-50 p-2 rounded-full bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm shadow-xl"
        title="Переключить роль (Админ/Клиент)"
      >
        {isAdmin ? <Unlock size={16} /> : <Lock size={16} />}
      </button>

      {viewMode === 'techniques' && (
        <TechniqueList
          onSelect={(tech) => { setSelectedTechnique(tech); setViewMode('decks'); }}
          isAdmin={isAdmin}
          onOpenAdminDecks={() => setViewMode('admin-decks')}
        />
      )}

      {viewMode === 'decks' && (
        <DeckList
          decks={decks}
          setDecks={setDecks}
          isAdmin={isAdmin}
          mode="client"
          onAddEmpty={handleAddNewDeck}
          onOpen={(id) => { setCurrentDeckId(id); setViewMode('session'); }}
          onManage={(id) => { setCurrentDeckId(id); setViewMode('manage-deck'); }}
          onBack={() => setViewMode('techniques')}
          selectedTechnique={selectedTechnique}
        />
      )}

      {viewMode === 'admin-decks' && isAdmin && (
        <DeckList
          decks={decks}
          setDecks={setDecks}
          isAdmin={isAdmin}
          mode="admin"
          onAddEmpty={handleAddNewDeck}
          onOpen={() => {}}
          onManage={(id) => { setCurrentDeckId(id); setViewMode('manage-deck'); }}
          onBack={() => setViewMode('techniques')}
        />
      )}

      {viewMode === 'manage-deck' && currentDeck && isAdmin && (
        <DeckManager
          deck={currentDeck}
          onUpdate={updateDeck}
          onDelete={() => handleDeleteDeck(currentDeck.id)}
          onBack={() => setViewMode('admin-decks')}
        />
      )}

      {viewMode === 'session' && currentDeck && selectedTechnique && (
        <GuidedSession
          deck={currentDeck}
          technique={selectedTechnique}
          onBack={() => setViewMode('techniques')}
        />
      )}
    </div>
  );
};

export default Index;
