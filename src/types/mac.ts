export interface CardImage {
  id: string;
  url: string;
  isFacedown?: boolean;
}

export interface Deck {
  id: string;
  name: string;
  images: string[];
  cardBack: string | null;
  order: number;
  enabledTechniques?: string[];
}

export interface Slot {
  id: string;
  label: string;
  x: number;
  y: number;
  blind: boolean;
  labelPos?: 'top' | 'bottom' | 'left' | 'right';
  isIkigai?: boolean;
  isTextCenter?: boolean;
  tablePrompts?: string[];
}

export interface Technique {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  desc: string;
  type: 'dynamic' | 'fixed';
  sequential?: boolean;
  cardScale?: number;
  bgRender: string | null;
  slots?: Slot[];
  prompts: string[];
}

export interface CardContext {
  cardObj: CardImage;
  url?: string;
  slotId?: string;
  slotLabel?: string;
  isDynamicTable?: boolean;
}

export interface CustomConnection {
  from: string;
  to: string;
}
