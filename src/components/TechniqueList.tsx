import { Database, BarChart3 } from 'lucide-react';
import { TECHNIQUES } from '@/data/techniques';
import type { Technique } from '@/types/mac';

interface TechniqueListProps {
  onSelect: (tech: Technique) => void;
  isAdmin: boolean;
  onOpenAdminDecks: () => void;
  onOpenDashboard?: () => void;
  enabledTechniqueIds?: string[];
}

export function TechniqueList({ onSelect, isAdmin, onOpenAdminDecks, enabledTechniqueIds }: TechniqueListProps) {
  const visibleTechniques = isAdmin
    ? TECHNIQUES
    : TECHNIQUES.filter(t => !enabledTechniqueIds || enabledTechniqueIds.includes(t.id));

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto h-full flex flex-col relative">
      {isAdmin && (
        <div className="absolute top-8 left-8">
          <button
            onClick={onOpenAdminDecks}
            className="flex items-center gap-3 px-6 py-3 bg-primary/20 hover:bg-primary/40 border border-primary/30 text-primary rounded-2xl font-bold transition-all shadow-lg active:scale-95"
          >
            <Database size={20} />
            <span>Создание колод</span>
          </button>
        </div>
      )}
      <div className="mb-16 text-center mt-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-5xl md:text-7xl font-black text-gradient-hero mb-6 tracking-tight drop-shadow-sm">
          Пространство смыслов
        </h1>
        <p className="text-lg md:text-2xl text-muted-foreground font-light tracking-wide max-w-3xl mx-auto">
          Платформа для проведения сессий с метафорическими картами
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleTechniques.map((tech, idx) => (
          <button
            key={tech.id}
            onClick={() => onSelect(tech)}
            className="group flex flex-col text-left p-8 glass-surface-hover shadow-xl animate-in fade-in zoom-in-95"
            style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
          >
            <div className="w-16 h-16 bg-secondary/30 rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:bg-primary/20 transition-all duration-300">
              <tech.icon size={32} className="text-muted-foreground group-hover:text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">{tech.name}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm flex-1">{tech.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
