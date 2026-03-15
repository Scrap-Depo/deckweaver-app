import { useState } from 'react';
import { X, MessageCircle, ArrowRight, LayoutGrid, Eye, Trash2 } from 'lucide-react';
import type { CardContext, Technique } from '@/types/mac';

interface CardFocusOverlayProps {
  cardContext: CardContext;
  technique: Technique;
  onClose: () => void;
  onMoveToTable?: () => void;
  isPreviewMode: boolean;
  isAlreadyOnTable?: boolean;
  onRemoveFromTable?: () => void;
}

export function CardFocusOverlay({
  cardContext, technique, onClose, onMoveToTable, isPreviewMode, isAlreadyOnTable, onRemoveFromTable
}: CardFocusOverlayProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isReflecting] = useState(!isPreviewMode);

  const questions = technique.prompts.length > 0 ? technique.prompts : [
    "Что вы видите на этой карте?",
    "Какие эмоции вызывает это изображение?"
  ];

  const handleNextQuestion = () => {
    if (questionIndex < questions.length - 1) setQuestionIndex(prev => prev + 1);
  };
  const isLastQuestion = questionIndex === questions.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex bg-background/95 backdrop-blur-3xl animate-in fade-in duration-300">
      <button onClick={onClose} className="absolute top-6 left-6 z-50 p-3 bg-secondary/30 hover:bg-secondary/50 backdrop-blur rounded-full text-muted-foreground hover:text-foreground transition-all border border-border/30">
        <X size={24} />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center p-12 lg:p-20 relative transition-all duration-500">
        <img src={cardContext.cardObj.url} className="max-h-full max-w-full object-contain rounded-2xl shadow-card border border-border/30" />

        {!isReflecting && isPreviewMode && (
          <div className="absolute bottom-12 flex gap-4 animate-in slide-in-from-bottom-8">
            <button onClick={onMoveToTable} className="px-8 py-4 bg-foreground text-background hover:bg-muted-foreground rounded-2xl font-black shadow-glow-primary transition-all active:scale-95 flex items-center gap-3">
              <LayoutGrid size={20} /> Переместить на стол
            </button>
          </div>
        )}

        {cardContext.slotLabel && (
          <div className="absolute bottom-12 bg-card text-primary px-8 py-4 rounded-2xl font-bold shadow-2xl tracking-widest uppercase text-sm border border-primary/30 whitespace-pre-line text-center">
            Роль: <span className="text-foreground">{cardContext.slotLabel.replace('\\n', ' ')}</span>
          </div>
        )}

        {isAlreadyOnTable && onRemoveFromTable && (
          <button onClick={onRemoveFromTable} className="absolute top-6 right-20 z-50 p-3 bg-destructive/20 hover:bg-destructive/40 border border-destructive/50 backdrop-blur rounded-full text-destructive hover:text-foreground transition-all shadow-xl" title="Удалить">
            <Trash2 size={24} />
          </button>
        )}
      </div>

      {isReflecting && (
        <div className="w-[450px] md:w-[500px] shrink-0 bg-card border-l border-border/30 flex flex-col shadow-[-30px_0_80px_rgba(0,0,0,0.8)] z-20 animate-in slide-in-from-right-8 duration-500">
          <div className="p-10 pb-6 border-b border-border/30 bg-gradient-to-b from-primary/5 to-transparent">
            <h3 className="text-primary font-bold uppercase tracking-[0.2em] text-sm flex items-center gap-3"><MessageCircle size={18} /> Анализ карты</h3>
            <div className="flex gap-1.5 mt-6">
              {questions.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${i <= questionIndex ? 'bg-primary shadow-glow-primary' : 'bg-muted'}`} />
              ))}
            </div>
          </div>

          <div className="flex-1 p-10 flex flex-col justify-center relative overflow-hidden">
            {questions.map((q, idx) => (
              <div key={idx} className={`absolute inset-0 p-10 flex items-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${idx === questionIndex ? 'opacity-100 translate-y-0 pointer-events-auto' : idx < questionIndex ? 'opacity-0 -translate-y-12 pointer-events-none' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
                <p className="text-2xl lg:text-3xl font-sans text-foreground font-normal leading-[1.4] tracking-tight text-balance">{q}</p>
              </div>
            ))}
          </div>

          <div className="p-8 border-t border-border/30 bg-background/40 backdrop-blur-md space-y-4">
            {!isLastQuestion ? (
              <button onClick={handleNextQuestion} className="w-full flex justify-between items-center px-8 py-5 bg-primary hover:bg-primary/80 text-primary-foreground rounded-2xl font-bold transition-all shadow-glow-primary active:scale-95 text-lg">
                <span>Следующий вопрос</span><ArrowRight size={20} />
              </button>
            ) : (
              isPreviewMode ? (
                <button onClick={onMoveToTable} className="w-full flex justify-center items-center px-8 py-5 bg-foreground text-background hover:bg-muted-foreground rounded-2xl font-black transition-all active:scale-95 text-lg gap-2">
                  <LayoutGrid size={20} /> Переместить на стол
                </button>
              ) : (
                <button onClick={onClose} className="w-full flex justify-center items-center px-8 py-5 bg-foreground text-background hover:bg-muted-foreground rounded-2xl font-black transition-all active:scale-95 text-lg">
                  Завершить анализ {isAlreadyOnTable ? 'карты' : 'слота'}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
