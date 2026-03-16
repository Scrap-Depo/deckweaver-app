import { useState } from 'react';
import { ArrowLeft, Plus, GripHorizontal, Settings } from 'lucide-react';
import { saveDeckToCloud } from '@/lib/adminAuth';
const MAX_DECKS = 6;
import type { Deck, Technique } from '@/types/mac';

interface DeckListProps {
  decks: Deck[];
  setDecks: (decks: Deck[]) => void;
  isAdmin: boolean;
  mode: 'client' | 'admin';
  onAddEmpty: () => void;
  onOpen: (id: string) => void;
  onManage: (id: string) => void;
  onBack: () => void;
  selectedTechnique?: Technique | null;
}

export function DeckList({ decks, setDecks, isAdmin, mode, onAddEmpty, onOpen, onManage, onBack, selectedTechnique }: DeckListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filteredDecks = mode === 'client' && selectedTechnique
    ? decks.filter(d => !d.enabledTechniques || d.enabledTechniques.length === 0 || d.enabledTechniques.includes(selectedTechnique.id))
    : decks;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isAdmin) { e.preventDefault(); return; }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetDeck: Deck) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetDeck.id || !isAdmin) return;
    const newDecks = [...decks];
    const draggedIndex = newDecks.findIndex(d => d.id === draggedId);
    const targetIndex = newDecks.findIndex(d => d.id === targetDeck.id);
    const [removed] = newDecks.splice(draggedIndex, 1);
    newDecks.splice(targetIndex, 0, removed);
    const reordered = newDecks.map((d, index) => ({ ...d, order: index }));
    setDecks(reordered);
    for (const deck of reordered) await saveDeckToCloud(deck);
  };

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-right-8 duration-500 relative">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 w-max px-4 py-2 bg-secondary/30 rounded-xl hover:bg-secondary/50">
        <ArrowLeft size={18} /> Назад {mode === 'client' ? 'к выбору техники' : 'на главную'}
      </button>

      <div className="mb-12">
        {mode === 'client' ? (
          <>
            <h2 className="text-muted-foreground text-sm font-bold uppercase tracking-widest mb-2">Шаг 2. Инструментарий</h2>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              Выберите колоду для техники <br />
              <span className="text-primary">{selectedTechnique?.name}</span>
            </h1>
          </>
        ) : (
          <>
            <h2 className="text-primary text-sm font-bold uppercase tracking-widest mb-2">Создание колод</h2>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Библиотека колод</h1>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDecks.map((deck) => (
          <div
            key={deck.id}
            draggable={isAdmin}
            onDragStart={(e) => handleDragStart(e, deck.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, deck)}
            className={`group relative glass-surface p-8 transition-all duration-300 hover:bg-secondary/60 hover:border-primary/50 hover:shadow-2xl flex flex-col justify-between min-h-[280px] ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-foreground truncate pr-4">{deck.name}</h3>
                {isAdmin && <GripHorizontal className="text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground mb-8">
                <div className="flex -space-x-3">
                  {deck.images.slice(0, 4).map((img, i) => (
                    <img key={i} src={img} alt="preview" className="w-10 h-10 rounded-lg object-cover border-2 border-card shadow-md" />
                  ))}
                  {deck.images.length === 0 && <div className="w-10 h-10 rounded-lg border-2 border-dashed border-border bg-muted/50" />}
                </div>
                <span className="font-medium bg-secondary/30 px-3 py-1 rounded-full text-xs">{deck.images.length} карт</span>
              </div>
            </div>
            <div className="flex gap-3 mt-auto">
              {mode === 'client' ? (
                <>
                  <button
                    onClick={() => onOpen(deck.id)}
                    disabled={deck.images.length === 0}
                    className="flex-1 bg-foreground text-background hover:bg-muted-foreground disabled:bg-muted disabled:text-muted-foreground px-4 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 text-sm active:scale-95"
                  >
                    {deck.images.length > 0 ? "Начать сессию" : "Колода пуста"}
                  </button>
                  {isAdmin && (
                    <button onClick={() => onManage(deck.id)} className="p-3 bg-secondary/30 hover:bg-secondary/50 text-muted-foreground rounded-xl transition-colors backdrop-blur-sm" title="Настройки колоды">
                      <Settings size={20} />
                    </button>
                  )}
                </>
              ) : (
                <button onClick={() => onManage(deck.id)} className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 text-sm active:scale-95">
                  <Settings size={18} /> Настроить
                </button>
              )}
            </div>
          </div>
        ))}

        {isAdmin && decks.length < MAX_DECKS && (
          <button onClick={onAddEmpty} className="border-2 border-dashed border-border/50 bg-card/20 backdrop-blur-sm rounded-3xl p-6 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-secondary/20 transition-all active:scale-95 min-h-[280px]">
            <Plus size={40} className="mb-4" />
            <span className="text-lg font-bold uppercase tracking-wider">Создать колоду</span>
          </button>
        )}
      </div>
    </div>
  );
}
