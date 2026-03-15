import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Eye, EyeOff, X, RotateCcw, LayoutGrid, Link2, Unlink, Info, SkipBack, Trash2
} from 'lucide-react';
import { CardFocusOverlay } from './CardFocusOverlay';
import type { Deck, Technique, CardImage, CustomConnection } from '@/types/mac';

interface GuidedSessionProps {
  deck: Deck;
  technique: Technique;
  onBack: () => void;
}

export function GuidedSession({ deck, technique, onBack }: GuidedSessionProps) {
  const [poolCards, setPoolCards] = useState<CardImage[]>([]);
  const [tableCards, setTableCards] = useState<(CardImage & { isFacedown?: boolean })[]>([]);
  const [assignedSlots, setAssignedSlots] = useState<Record<string, CardImage>>({});
  const [isPoolBlind, setIsPoolBlind] = useState(false);

  const [showSubpersonalitiesInfo, setShowSubpersonalitiesInfo] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(true);
  const [customConnections, setCustomConnections] = useState<CustomConnection[]>([]);
  const [isDrawingLink, setIsDrawingLink] = useState(false);
  const [linkStartSlot, setLinkStartSlot] = useState<string | null>(null);

  const [previewCard, setPreviewCard] = useState<CardImage | null>(null);
  const [tableCardZoom, setTableCardZoom] = useState<{ url: string; cardObj: CardImage; slotId?: string; isDynamicTable?: boolean } | null>(null);
  const [focusCard, setFocusCard] = useState<{ cardObj: CardImage; slotId?: string; slotLabel?: string; isDynamicTable?: boolean } | null>(null);
  const [visibleSlotsCount, setVisibleSlotsCount] = useState(1);

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const shuffled = [...deck.images].sort(() => Math.random() - 0.5);
    setPoolCards(shuffled.map(img => ({ id: crypto.randomUUID(), url: img })));
    setTableCards([]);
    setAssignedSlots({});
    setCustomConnections([]);
    setIsDrawingLink(false);
    setLinkStartSlot(null);
    setVisibleSlotsCount(1);
    setIsPoolBlind(false);
  }, [deck, technique]);

  useEffect(() => {
    if (technique.sequential && technique.slots) {
      let nextEmptyIndex = technique.slots.findIndex(slot => !assignedSlots[slot.id]);
      if (nextEmptyIndex === -1) nextEmptyIndex = technique.slots.length;
      setVisibleSlotsCount(nextEmptyIndex + 1);
    }
  }, [assignedSlots, technique]);

  useEffect(() => {
    if (tableScrollRef.current && tableCards.length > 0) {
      tableScrollRef.current.scrollTo({ left: tableScrollRef.current.scrollWidth, behavior: 'smooth' });
    }
  }, [tableCards.length]);

  const handleReset = () => {
    const shuffled = [...deck.images].sort(() => Math.random() - 0.5);
    setPoolCards(shuffled.map(img => ({ id: crypto.randomUUID(), url: img })));
    setTableCards([]);
    setAssignedSlots({});
    setCustomConnections([]);
    setIsDrawingLink(false);
    setLinkStartSlot(null);
    setVisibleSlotsCount(1);
  };

  const handlePoolCardInteraction = (_e: React.MouseEvent, card: CardImage) => {
    if (technique.type === 'dynamic') {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        moveToDynamicTable(card.id, false);
      } else {
        clickTimerRef.current = setTimeout(() => {
          clickTimerRef.current = null;
          if (isPoolBlind) {
            moveToDynamicTable(card.id, true);
          } else {
            setPreviewCard(card);
          }
        }, 250);
      }
    } else {
      if (!isPoolBlind) {
        setTableCardZoom({ url: card.url, cardObj: card });
      }
    }
  };

  const moveToDynamicTable = (cardId: string, forceBlind = false) => {
    setPoolCards(prev => {
      const card = prev.find(c => c.id === cardId);
      if (!card) return prev;
      setTableCards(t => [...t, { ...card, isFacedown: forceBlind || isPoolBlind }]);
      return prev.filter(c => c.id !== cardId);
    });
    setPreviewCard(null);
    setTimeout(() => tableScrollRef.current?.scrollTo({ left: tableScrollRef.current.scrollWidth, behavior: 'smooth' }), 100);
  };

  const handleTableCardClick = (cardId: string) => {
    setTableCards(prev => prev.map(c => {
      if (c.id === cardId) {
        if (c.isFacedown) {
          return { ...c, isFacedown: false };
        } else {
          setFocusCard({ cardObj: c, isDynamicTable: true });
        }
      }
      return c;
    }));
  };

  const handleRemoveFromTable = (e: React.MouseEvent | null, cardId: string) => {
    if (e) e.stopPropagation();
    const card = tableCards.find(c => c.id === cardId);
    if (card) {
      setTableCards(prev => prev.filter(c => c.id !== cardId));
      setPoolCards(prev => [...prev, { ...card, isFacedown: false }]);
    }
  };

  const handleDragStart = (e: React.DragEvent, card: CardImage) => {
    if (technique.type !== 'fixed') return;
    e.dataTransfer.setData('cardId', card.id);
  };

  const handleDropOnSlot = (e: React.DragEvent, slot: { id: string; blind?: boolean; isTextCenter?: boolean }) => {
    e.preventDefault();
    if (slot.blind || slot.isTextCenter) return;
    const cardId = e.dataTransfer.getData('cardId');
    const card = poolCards.find(c => c.id === cardId);
    if (!card) return;
    setPoolCards(prev => prev.filter(c => c.id !== cardId));
    setAssignedSlots(prev => ({ ...prev, [slot.id]: card }));
  };

  const handleDrawBlindForSlot = (slot: { id: string; isTextCenter?: boolean }) => {
    if (poolCards.length === 0 || slot.isTextCenter) return;
    const card = poolCards[0];
    setPoolCards(prev => prev.slice(1));
    setAssignedSlots(prev => ({ ...prev, [slot.id]: card }));
  };

  const handleRemoveFromSlot = (e: React.MouseEvent | null, slotId: string, card: CardImage) => {
    if (e) e.stopPropagation();
    setAssignedSlots(prev => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
    setPoolCards(prev => [...prev, card]);
  };

  const handleSlotClick = (slot: { id: string; isTextCenter?: boolean }, assignedCard?: CardImage) => {
    if (technique.id === 'subpersonalities' && isDrawingLink) {
      if (!linkStartSlot) {
        setLinkStartSlot(slot.id);
      } else {
        if (linkStartSlot !== slot.id) {
          const exists = customConnections.some(c => (c.from === linkStartSlot && c.to === slot.id) || (c.from === slot.id && c.to === linkStartSlot));
          if (!exists) setCustomConnections(prev => [...prev, { from: linkStartSlot!, to: slot.id }]);
        }
        setLinkStartSlot(null);
        setIsDrawingLink(false);
      }
      return;
    }
    if (!assignedCard) return;
    setTableCardZoom({ url: assignedCard.url, cardObj: assignedCard, slotId: slot.id });
  };

  // --- RENDER BACKGROUNDS ---
  const renderBackground = () => {
    if (technique.bgRender === 'road') {
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60 z-0">
          <svg className="w-full h-full drop-shadow-2xl" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <marker id="arrow-grow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="rgba(255, 255, 255, 0.8)" />
              </marker>
            </defs>
            <path d="M 15 90 C 40 70, 70 60, 85 15" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="0.5" strokeDasharray="2,2" strokeLinecap="round" markerEnd="url(#arrow-grow)" />
            <path d="M 15 90 C 40 70, 70 60, 85 15" fill="none" stroke="hsl(var(--primary) / 0.2)" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      );
    }
    if (technique.bgRender === 'ikigai') {
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="relative w-[700px] h-[700px] opacity-80 scale-90 md:scale-100">
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-yellow-400/20 mix-blend-screen blur-[1px]" />
            <div className="absolute bottom-[25%] left-0 w-[350px] h-[350px] rounded-full bg-green-500/20 mix-blend-screen blur-[1px]" />
            <div className="absolute bottom-[25%] right-0 w-[350px] h-[350px] rounded-full bg-red-500/20 mix-blend-screen blur-[1px]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-blue-500/20 mix-blend-screen blur-[1px]" />

            <div className="absolute z-10 flex items-center justify-center w-32 h-8" style={{ top: '28%', left: '26%' }}>
              <span className="bg-card/90 backdrop-blur-sm px-4 py-1.5 rounded-xl text-[14px] font-normal text-foreground uppercase tracking-widest text-center shadow-2xl border border-border/50">Страсть</span>
            </div>
            <div className="absolute z-10 flex items-center justify-center w-32 h-8" style={{ top: '28%', right: '26%' }}>
              <span className="bg-card/90 backdrop-blur-sm px-4 py-1.5 rounded-xl text-[14px] font-normal text-foreground uppercase tracking-widest text-center shadow-2xl border border-border/50">Миссия</span>
            </div>
            <div className="absolute z-10 flex items-center justify-center w-32 h-8" style={{ bottom: '26%', left: '26%' }}>
              <span className="bg-card/90 backdrop-blur-sm px-4 py-1.5 rounded-xl text-[14px] font-normal text-foreground uppercase tracking-widest text-center shadow-2xl border border-border/50">Профессия</span>
            </div>
            <div className="absolute z-10 flex items-center justify-center w-32 h-8" style={{ bottom: '26%', right: '26%' }}>
              <span className="bg-card/90 backdrop-blur-sm px-4 py-1.5 rounded-xl text-[14px] font-normal text-foreground uppercase tracking-widest text-center shadow-2xl border border-border/50">Призвание</span>
            </div>

            <div className="absolute text-[16px] font-black text-yellow-300 uppercase text-center w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ top: '5%' }}>Что мне НРАВИТСЯ?</div>
            <div className="absolute text-[16px] font-black text-green-300 uppercase text-center w-48 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ left: '-15%', top: '50%', transform: 'translateY(-50%)' }}>Что я умею делать ХОРОШО?</div>
            <div className="absolute text-[16px] font-black text-red-300 uppercase text-center w-48 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ right: '-15%', top: '50%', transform: 'translateY(-50%)' }}>Как я могу принести ПОЛЬЗУ?</div>
            <div className="absolute text-[16px] font-black text-blue-300 uppercase text-center w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ bottom: '-5%' }}>Что даст мне средства К СУЩЕСТВОВАНИЮ?</div>
          </div>
        </div>
      );
    }
    if (technique.bgRender === 'timeline') {
      return <div className="absolute top-[35%] left-10 right-10 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none shadow-glow-primary z-0" />;
    }
    if (technique.bgRender === 'versus') {
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-90 z-0">
          <defs>
            <marker id="red-arrow-left" markerWidth="6" markerHeight="6" refX="2" refY="3" orient="auto">
              <path d="M 6 0 L 0 3 L 6 6 z" fill="hsl(var(--destructive))" />
            </marker>
            <marker id="red-arrow-right" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 z" fill="hsl(var(--destructive))" />
            </marker>
          </defs>
          <line x1="30%" y1="30%" x2="70%" y2="30%" stroke="hsl(var(--destructive))" strokeWidth="4" markerStart="url(#red-arrow-left)" markerEnd="url(#red-arrow-right)" />
          <line x1="30%" y1="70%" x2="70%" y2="70%" stroke="hsl(var(--destructive))" strokeWidth="4" markerStart="url(#red-arrow-left)" markerEnd="url(#red-arrow-right)" />
          {customConnections.map((conn, idx) => {
            const s1 = technique.slots?.find(s => s.id === conn.from);
            const s2 = technique.slots?.find(s => s.id === conn.to);
            if (!s1 || !s2) return null;
            return (
              <line key={idx} x1={`${s1.x}%`} y1={`${s1.y}%`} x2={`${s2.x}%`} y2={`${s2.y}%`}
                stroke="hsl(var(--destructive))" strokeWidth="3"
                markerStart="url(#red-arrow-left)" markerEnd="url(#red-arrow-right)"
                className="animate-pulse" />
            );
          })}
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="h-screen flex flex-col bg-transparent overflow-hidden relative z-10 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/30 bg-background/80 backdrop-blur-xl shadow-sm z-30">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <h2 className="text-sm font-bold text-foreground leading-tight uppercase tracking-wider">{technique.name}</h2>
            <p className="text-xs text-primary font-medium mt-0.5 opacity-80">Колода: {deck.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {technique.id === 'subpersonalities' && (
            <div className="flex items-center gap-2 mr-4 border-r border-border/30 pr-4">
              {isDrawingLink ? (
                <div className="flex items-center gap-3 px-4 py-2 bg-destructive/20 border border-destructive/50 text-destructive rounded-xl text-sm font-bold animate-pulse shadow-[0_0_15px_hsl(var(--destructive)/0.4)]">
                  <Link2 size={16} /> Выберите два слота...
                  <button onClick={() => { setIsDrawingLink(false); setLinkStartSlot(null); }} className="ml-2 bg-destructive/30 p-1 rounded-md hover:bg-destructive/50"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => setIsDrawingLink(true)} className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-secondary text-foreground rounded-xl text-sm font-bold transition-colors shadow-lg border border-border/30">
                  <Link2 size={16} /> Создать связь
                </button>
              )}
              {customConnections.length > 0 && !isDrawingLink && (
                <button onClick={() => setCustomConnections([])} className="flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-secondary/50 text-muted-foreground hover:text-foreground rounded-xl text-sm transition-colors" title="Очистить связи">
                  <Unlink size={16} />
                </button>
              )}
              <button onClick={() => setShowSubpersonalitiesInfo(!showSubpersonalitiesInfo)} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-primary-foreground rounded-xl text-base font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.6)] ml-2">
                <Info size={18} /> Инструкция
              </button>
            </div>
          )}
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl text-sm font-semibold transition-colors">
            <RotateCcw size={16} /> Очистить стол
          </button>
        </div>
      </div>

      {/* Subpersonalities info */}
      {technique.id === 'subpersonalities' && showSubpersonalitiesInfo && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-blue-950/95 border-2 border-blue-400/50 p-10 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-50 animate-in slide-in-from-top-8">
          <button onClick={() => setShowSubpersonalitiesInfo(false)} className="absolute top-6 right-6 text-blue-300 hover:text-foreground bg-blue-900/50 p-2 rounded-full"><X size={24} /></button>
          <h3 className="text-foreground font-black mb-6 uppercase tracking-widest text-xl border-b border-blue-500/30 pb-4">Как работать с техникой</h3>
          <ul className="text-lg text-blue-100 space-y-4 leading-relaxed">
            <li><strong className="text-foreground bg-blue-600 px-2 py-0.5 rounded-md mr-2 shadow-lg">1</strong> К какой ситуации вы хотели бы изменить отношение?</li>
            <li><strong className="text-foreground bg-blue-600 px-2 py-0.5 rounded-md mr-2 shadow-lg">2</strong> Какая грань вашей личности негативно реагирует на ситуацию? Выберите карту в слот 1.</li>
            <li><strong className="text-foreground bg-blue-600 px-2 py-0.5 rounded-md mr-2 shadow-lg">3</strong> С какой гранью вашей личности эта субличность конфликтует? Выберите карту в слот 2.</li>
            <li><strong className="text-foreground bg-blue-600 px-2 py-0.5 rounded-md mr-2 shadow-lg">4</strong> Какие грани вашей личности реагируют на ситуацию ещё? Выложите в свободные слоты.</li>
            <li><strong className="text-foreground bg-blue-600 px-2 py-0.5 rounded-md mr-2 shadow-lg">5</strong> К каким выводам и решениям вы пришли?</li>
          </ul>
        </div>
      )}

      {/* MAIN AREA: TABLE / SPREAD */}
      <div className="shrink-0 h-[70vh] bg-primary/5 border-b border-border/30 relative flex flex-col shadow-2xl backdrop-blur-md z-10 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b from-background/60 to-transparent pointer-events-none z-0 transition-colors ${isDrawingLink ? 'bg-destructive/10' : ''}`} />
        {renderBackground()}

        {technique.type === 'dynamic' ? (
          <div className="w-full h-full flex flex-col z-10">
            <div className="px-6 py-4 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <LayoutGrid size={16} /> Рабочий стол ({tableCards.length})
                </span>
                {tableCards.length > 0 && (
                  <button onClick={() => tableScrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' })} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-full transition-colors">
                    <SkipBack size={14} /> В начало ряда
                  </button>
                )}
              </div>
            </div>

            <div ref={tableScrollRef} className="flex-1 w-full overflow-x-auto overflow-y-hidden px-8 pb-8 pt-2 flex items-center gap-8 custom-scrollbar relative z-10">
              {tableCards.length === 0 ? (
                <div className="w-full flex flex-col justify-center items-center h-full text-muted-foreground border-2 border-dashed border-border/50 glass-surface mx-auto max-w-md font-medium text-center p-6">
                  <span>Кликните на любую карту в пуле внизу,<br />чтобы осмотреть её и отложить на стол</span>
                  <span className="mt-4 text-xs text-muted-foreground/60">Двойной клик по пулу для быстрого переноса</span>
                </div>
              ) : (
                tableCards.map((card) => (
                  <div key={card.id} className="shrink-0 group relative cursor-pointer" onClick={() => handleTableCardClick(card.id)}>
                    <div className="w-56 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-card border border-border/50 relative transition-transform duration-300 hover:-translate-y-3 group-hover:border-primary/50 bg-card">
                      {card.isFacedown ? (
                        deck.cardBack ? <img src={deck.cardBack} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-card"><EyeOff size={40} className="text-primary/50" /></div>
                      ) : (
                        <img src={card.url} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        {card.isFacedown ? (
                          <div className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-2xl scale-95 group-hover:scale-100 transition-transform"><Eye size={18} /> Перевернуть</div>
                        ) : (
                          <div className="bg-foreground text-background px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-2xl scale-95 group-hover:scale-100 transition-transform"><Eye size={18} /> Увеличить</div>
                        )}
                      </div>
                    </div>
                    <button onClick={(e) => handleRemoveFromTable(e, card.id)} className="absolute -top-3 -right-3 bg-destructive hover:bg-destructive/80 text-destructive-foreground p-2 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20" title="Убрать со стола">
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative z-10">
            {technique.slots?.map((slot, index) => {
              if (technique.sequential && index >= visibleSlotsCount && !slot.isTextCenter) return null;

              if (slot.isTextCenter) {
                if (!isDossierOpen) {
                  return (
                    <button key={slot.id} onClick={() => setIsDossierOpen(true)} className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-primary hover:bg-primary/80 text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-2 transition-all z-20" style={{ left: `${slot.x}%`, top: `${slot.y}%` }}>
                      <Eye size={18} /> Развернуть Досье
                    </button>
                  );
                }
                return (
                  <div key={slot.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-card/95 border border-primary/30 p-10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl w-[500px] z-20 transition-all animate-in zoom-in-95" style={{ left: `${slot.x}%`, top: `${slot.y}%` }}>
                    <button onClick={() => setIsDossierOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground bg-secondary/30 p-2 rounded-full"><X size={16} /></button>
                    <h4 className="text-primary font-bold uppercase text-xl tracking-widest mb-6 border-b border-border/50 pb-4 text-center mr-4">Досье Субличности</h4>
                    <ul className="text-lg text-foreground/80 space-y-4 leading-relaxed font-medium">
                      <li>• Придумайте имя</li>
                      <li>• Что говорит (девиз)?</li>
                      <li>• Как себя проявляет?</li>
                      <li>• С какой частью в конфликте?</li>
                      <li>• В чем позитивное намерение?</li>
                      <li>• Для чего большего это важно?</li>
                      <li>• Каких ресурсов не хватает?</li>
                      <li>• Как помочь найти ресурсы?</li>
                    </ul>
                  </div>
                );
              }

              const assignedCard = assignedSlots[slot.id];
              const isStartTarget = isDrawingLink && linkStartSlot === slot.id;
              const isHighlightTarget = isDrawingLink && linkStartSlot && linkStartSlot !== slot.id;

              return (
                <div
                  key={slot.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-300"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnSlot(e, slot)}
                  onClick={() => handleSlotClick(slot, assignedCard)}
                >
                  {!slot.isIkigai && (
                    <div className={`absolute text-[10px] md:text-xs font-bold text-foreground/80 uppercase tracking-widest bg-background/90 px-4 py-2 rounded-full border border-primary/30 backdrop-blur-md whitespace-nowrap shadow-2xl text-center min-w-[140px] pointer-events-none z-30
                      ${slot.labelPos === 'bottom' ? 'top-[105%]' :
                        slot.labelPos === 'left' ? 'right-[105%] top-1/2 -translate-y-1/2' :
                        slot.labelPos === 'right' ? 'left-[105%] top-1/2 -translate-y-1/2' :
                        'bottom-[105%]'}
                    `}>
                      {slot.label}
                    </div>
                  )}

                  {assignedCard ? (
                    <div className="flex flex-col items-center gap-3 relative">
                      <div className={`w-24 md:w-32 aspect-[2/3] rounded-xl overflow-hidden shadow-card border-2 cursor-pointer group transition-transform duration-300 relative bg-card
                        ${isStartTarget ? 'border-destructive shadow-[0_0_30px_hsl(var(--destructive)/0.8)] scale-110 z-50' :
                          isHighlightTarget ? 'border-destructive/60 hover:border-destructive hover:scale-110 animate-pulse' :
                          'border-primary/60 hover:scale-105'}
                      `}>
                        <img src={assignedCard.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          {isDrawingLink ? (
                            <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-xl"><Link2 size={14} /> Связать</div>
                          ) : (
                            <div className="bg-foreground text-background px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-xl"><Eye size={14} /> Увеличить</div>
                          )}
                        </div>
                      </div>
                      <button onClick={(e) => handleRemoveFromSlot(e, slot.id, assignedCard)} className="absolute -top-3 -right-3 bg-destructive hover:bg-destructive/80 text-destructive-foreground p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20" title="Убрать со стола">
                        <X size={14} />
                      </button>

                      {technique.id === 'score' && slot.tablePrompts && (index === 0 || assignedSlots[technique.slots![index - 1].id]) && (
                        <div className="absolute top-[100%] w-[130px] md:w-[150px] text-[10px] md:text-[11px] font-normal text-foreground/80 mt-4 text-left leading-relaxed space-y-1.5 drop-shadow-md bg-card/95 backdrop-blur-xl p-4 rounded-xl border border-primary/50 pointer-events-none shadow-card animate-in slide-in-from-top-4 fade-in z-20 h-auto">
                          {slot.tablePrompts.map((p, i) => <p key={i}>{p}</p>)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center relative">
                      <div className={`w-24 md:w-32 aspect-[2/3] rounded-xl border-2 border-dashed flex items-center justify-center backdrop-blur-md relative overflow-hidden shadow-inner cursor-pointer
                        ${isStartTarget ? 'border-destructive bg-destructive/20 scale-110 z-50' :
                          isHighlightTarget ? 'border-destructive/50 bg-background/50 hover:bg-destructive/20' :
                          'border-border/40 bg-background/30 hover:bg-secondary/20'}
                      `}>
                        {isDrawingLink ? (
                          <div className="text-destructive text-[10px] font-bold uppercase text-center p-2"><Link2 size={24} className="mx-auto mb-2" /> Выбрать</div>
                        ) : slot.blind ? (
                          <button onClick={(e) => { e.stopPropagation(); handleDrawBlindForSlot(slot); }} className="w-full h-full flex flex-col items-center justify-center text-primary hover:bg-primary/20 transition-colors p-2 text-center group">
                            <EyeOff size={28} className="mb-2 group-hover:scale-110 transition-transform drop-shadow-lg" />
                            <span className="text-[9px] font-bold uppercase leading-tight">Вслепую</span>
                          </button>
                        ) : (
                          <div className={`text-muted-foreground text-[10px] font-bold uppercase text-center p-2 leading-relaxed opacity-60 pointer-events-none ${slot.isIkigai ? 'hidden' : ''}`} />
                        )}
                      </div>

                      {technique.id === 'score' && slot.tablePrompts && (index === 0 || assignedSlots[technique.slots![index - 1].id]) && (
                        <div className="absolute top-[100%] w-[130px] md:w-[150px] text-[10px] md:text-[11px] font-normal text-foreground/80 mt-4 text-left leading-relaxed space-y-1.5 drop-shadow-md bg-card/95 backdrop-blur-xl p-4 rounded-xl border border-primary/50 pointer-events-none shadow-card animate-in slide-in-from-top-4 fade-in z-20 h-auto">
                          {slot.tablePrompts.map((p, i) => <p key={i}>{p}</p>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POOL */}
      <div className="flex-1 overflow-y-auto p-6 bg-background/80 relative custom-scrollbar z-0 border-t border-border/30 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-muted-foreground font-bold text-xs tracking-widest uppercase">Колода пула ({poolCards.length})</h3>
            <div className="flex items-center gap-4">
              {technique.type === 'dynamic' ? (
                <span className="text-[10px] text-muted-foreground/60 bg-secondary/30 px-3 py-1.5 rounded-full uppercase tracking-wider hidden md:block">Двойной клик для быстрого переноса</span>
              ) : (
                <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full uppercase tracking-wider hidden md:block">Перетащите карту на слот</span>
              )}
              <button onClick={() => setIsPoolBlind(!isPoolBlind)} className="flex items-center gap-2 text-[10px] md:text-xs bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 px-4 py-2 rounded-full transition-colors uppercase tracking-widest font-bold shadow-lg">
                {isPoolBlind ? <><Eye size={16} /> В открытую</> : <><EyeOff size={16} /> Рубашкой вверх</>}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-12 gap-3 pb-10">
            {poolCards.map((card) => (
              <div
                key={card.id}
                draggable={technique.type === 'fixed'}
                onDragStart={(e) => handleDragStart(e, card)}
                onClick={(e) => handlePoolCardInteraction(e, card)}
                className={`${technique.type === 'fixed' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} group hover:-translate-y-2 transition-transform duration-300 relative`}
              >
                <div className="aspect-[2/3] rounded-lg overflow-hidden border border-border/30 shadow-[0_4px_10px_rgba(0,0,0,0.5)] group-hover:shadow-glow-primary group-hover:border-primary/50 bg-card">
                  {isPoolBlind ? (
                    deck.cardBack ? (
                      <img src={deck.cardBack} className="w-full h-full object-cover pointer-events-none" alt="Рубашка" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-card"><EyeOff size={24} className="text-primary/50" /></div>
                    )
                  ) : (
                    <img src={card.url} className="w-full h-full object-cover pointer-events-none" alt="Карта" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {previewCard && (
        <CardFocusOverlay
          cardContext={{ cardObj: previewCard }}
          technique={technique}
          onClose={() => setPreviewCard(null)}
          onMoveToTable={() => moveToDynamicTable(previewCard.id)}
          isPreviewMode={true}
        />
      )}

      {tableCardZoom && (
        <div className="fixed inset-0 z-[120] bg-background/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in zoom-in-95 cursor-zoom-out" onClick={() => setTableCardZoom(null)}>
          <button onClick={() => setTableCardZoom(null)} className="absolute top-6 right-6 z-50 p-3 bg-secondary/30 hover:bg-secondary/50 backdrop-blur rounded-full text-muted-foreground hover:text-foreground transition-all border border-border/30 cursor-pointer"><X size={24} /></button>
          <img src={tableCardZoom.url} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-card border border-border/30 mb-16" />
          <div className="absolute bottom-8 flex gap-4">
            {tableCardZoom.slotId ? (
              <button onClick={(e) => { e.stopPropagation(); handleRemoveFromSlot(e, tableCardZoom.slotId!, tableCardZoom.cardObj); setTableCardZoom(null); }} className="px-8 py-4 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-2xl font-bold shadow-[0_0_30px_hsl(var(--destructive)/0.3)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
                <Trash2 size={20} /> Удалить
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); handleRemoveFromTable(e, tableCardZoom.cardObj?.id); setTableCardZoom(null); }} className="px-8 py-4 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-2xl font-bold shadow-[0_0_30px_hsl(var(--destructive)/0.3)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
                <Trash2 size={20} /> Удалить
              </button>
            )}
          </div>
        </div>
      )}

      {focusCard && (
        <CardFocusOverlay
          cardContext={focusCard}
          technique={technique}
          onClose={() => setFocusCard(null)}
          isPreviewMode={false}
          isAlreadyOnTable={focusCard.isDynamicTable}
          onRemoveFromTable={() => {
            if (focusCard.isDynamicTable) {
              handleRemoveFromTable(null, focusCard.cardObj.id);
            } else {
              handleRemoveFromSlot(null, focusCard.slotId!, focusCard.cardObj);
            }
            setFocusCard(null);
          }}
        />
      )}
    </div>
  );
}
