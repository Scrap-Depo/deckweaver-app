import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Loader2 } from 'lucide-react';
import { uploadImageToCloud, deleteCardFromCloud } from '@/lib/adminAuth';
import { loadDeckCards } from '@/lib/deckService';
import { TECHNIQUES } from '@/data/techniques';
import type { Deck } from '@/types/mac';

interface DeckManagerProps {
  deck: Deck;
  onUpdate: (deck: Deck) => void;
  onDelete: () => void;
  onBack: () => void;
}

interface CardRecord {
  id: string;
  deck_id: string;
  image_url: string;
  order: number;
}

export function DeckManager({ deck, onUpdate, onDelete, onBack }: DeckManagerProps) {
  const [name, setName] = useState(deck.name);
  const [uploading, setUploading] = useState(false);
  const [cards, setCards] = useState<CardRecord[]>([]);

  useEffect(() => {
    loadDeckCards(deck.id).then(setCards);
  }, [deck.id]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    onUpdate({ ...deck, name: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const newImages: string[] = [];
    for (const file of files) {
      const base64 = await fileToBase64(file);
      const url = await uploadImageToCloud(deck.id, base64, file.name, false);
      if (url) newImages.push(url);
    }
    if (newImages.length > 0) {
      onUpdate({ ...deck, images: [...deck.images, ...newImages] });
      const updatedCards = await loadDeckCards(deck.id);
      setCards(updatedCards);
    }
    setUploading(false);
  };

  const handleCardBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const base64 = await fileToBase64(file);
    const url = await uploadImageToCloud(deck.id, base64, file.name, true);
    if (url) onUpdate({ ...deck, cardBack: url });
    setUploading(false);
  };

  const handleDeleteCard = async (index: number) => {
    const card = cards[index];
    if (!card) return;
    await deleteCardFromCloud(card.id, card.image_url);
    const newImages = deck.images.filter((_, i) => i !== index);
    onUpdate({ ...deck, images: newImages });
    setCards(prev => prev.filter((_, i) => i !== index));
  };

  const handleTechniqueToggle = (techId: string) => {
    const current = deck.enabledTechniques || [];
    const updated = current.includes(techId)
      ? current.filter(id => id !== techId)
      : [...current, techId];
    onUpdate({ ...deck, enabledTechniques: updated });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col relative z-10 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/30">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} /> Назад
        </button>
        <button onClick={onDelete} className="flex items-center gap-2 text-destructive hover:text-destructive/80 transition-colors px-4 py-2 bg-destructive/10 hover:bg-destructive/20 rounded-lg">
          <Trash2 size={18} /> Удалить колоду
        </button>
      </div>

      {uploading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center">
          <div className="flex items-center gap-3 text-foreground bg-card px-8 py-4 rounded-2xl shadow-2xl border border-border/50">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="font-medium">Загрузка изображений...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-surface p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Название колоды</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="glass-surface p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Рубашка карт</h3>
            <div className="aspect-[2/3] bg-background/50 rounded-2xl border-2 border-dashed border-border/50 relative overflow-hidden flex items-center justify-center group">
              {deck.cardBack ? (
                <>
                  <img src={deck.cardBack} alt="Рубашка" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-secondary/50 backdrop-blur px-4 py-2 rounded-lg text-foreground text-sm hover:bg-secondary/70">
                      <input type="file" accept="image/*" className="hidden" onChange={handleCardBackUpload} />
                      Заменить
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center text-muted-foreground hover:text-primary transition-colors w-full h-full justify-center">
                  <Plus size={32} className="mb-2" />
                  <span className="text-sm">Загрузить рубашку</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleCardBackUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="glass-surface p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Доступность для техник</h3>
            <p className="text-xs text-muted-foreground/60 mb-3">Если ничего не выбрано — доступна для всех</p>
            <div className="space-y-2">
              {TECHNIQUES.map(tech => (
                <label key={tech.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={(deck.enabledTechniques || []).includes(tech.id)}
                    onChange={() => handleTechniqueToggle(tech.id)}
                    className="rounded border-border bg-background accent-primary"
                  />
                  <span className="text-sm text-foreground">{tech.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-surface p-6 min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-foreground">Изображения ({deck.images.length})</h2>
              <label className="bg-foreground text-background hover:bg-muted-foreground px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all shadow-lg flex items-center gap-2">
                <Plus size={18} /> Добавить
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {deck.images.map((img, idx) => (
                <div key={idx} className="group relative aspect-[2/3] bg-background/50 rounded-xl overflow-hidden border border-border/50 shadow-md">
                  <img src={img} alt={`Card ${idx}`} className="w-full h-full object-cover" />
                  <button onClick={() => handleDeleteCard(idx)} className="absolute top-2 right-2 p-2 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
