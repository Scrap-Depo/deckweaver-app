import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { getAllDecksFromDB, saveDeckToDB, deleteDeckFromDB } from '@/lib/db';
import { trackSession, trackDeckUsage } from '@/lib/analytics';
import { getAdminToken, verifyAdminToken, clearAdminToken } from '@/lib/adminAuth';
import { TechniqueList } from '@/components/TechniqueList';
import { DeckList } from '@/components/DeckList';
import { DeckManager } from '@/components/DeckManager';
import { GuidedSession } from '@/components/GuidedSession';
import { AdminLogin } from '@/components/AdminLogin';
import { AdminDashboard } from '@/components/AdminDashboard';
import type { Deck, Technique } from '@/types/mac';

type ViewMode = 'techniques' | 'decks' | 'admin-login' | 'admin-decks' | 'admin-dashboard' | 'manage-deck' | 'session';

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
        // Check if already logged in as admin
        if (getAdminToken()) {
          const valid = await verifyAdminToken();
          setIsAdmin(valid);
          if (!valid) clearAdminToken();
        }
      } catch (e) {
        console.error("Ошибка загрузки БД:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
    // Track anonymous session
    trackSession();
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

  const handleStartSession = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId);
    if (deck && selectedTechnique) {
      trackDeckUsage(deck.name, selectedTechnique.name);
    }
    setCurrentDeckId(deckId);
    setViewMode('session');
  };

  const handleAdminClick = () => {
    if (isAdmin) {
      setViewMode('admin-dashboard');
    } else {
      setViewMode('admin-login');
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setViewMode('admin-dashboard');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    clearAdminToken();
    setViewMode('techniques');
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
      {/* Admin button */}
      {viewMode !== 'admin-login' && viewMode !== 'admin-dashboard' && (
        <button
          onClick={handleAdminClick}
          className="fixed top-6 right-6 z-50 p-2 rounded-full bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm shadow-xl"
          title={isAdmin ? "Панель администратора" : "Войти как администратор"}
        >
          <Shield size={16} className={isAdmin ? "text-primary" : ""} />
        </button>
      )}

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
          onOpen={handleStartSession}
          onManage={(id) => { setCurrentDeckId(id); setViewMode('manage-deck'); }}
          onBack={() => setViewMode('techniques')}
          selectedTechnique={selectedTechnique}
        />
      )}

      {viewMode === 'admin-login' && (
        <AdminLogin
          onSuccess={handleAdminLoginSuccess}
          onBack={() => setViewMode('techniques')}
        />
      )}

      {viewMode === 'admin-dashboard' && isAdmin && (
        <AdminDashboard
          onBack={() => setViewMode('admin-decks')}
          onLogout={handleAdminLogout}
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
