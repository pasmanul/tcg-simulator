// theme.ts — Spatial Design System
// Replaces the previous 4-skin civilization palette.
// Tone-driven: switch via document.documentElement.dataset.tone.

export type Tone = 'dusk' | 'dawn';
export const TONES: Tone[] = ['dusk', 'dawn'];

export interface ToneTokens {
  canvas: string; bg: string; surface: string; surface2: string; surface3: string;
  text: string; text2: string; text3: string;
  accent: string; accentSoft: string;
  border: string; borderStrong: string;
  zone: { battle: string; mana: string; shield: string; graveyard: string; deck: string; hand: string; temp: string };
  shadow1: string; shadow2: string; shadow3: string;
}

export const TONE_TOKENS: Record<Tone, ToneTokens> = {
  dusk: {
    canvas: '#0e1014', bg: '#14171d', surface: '#1a1e26', surface2: '#20242d', surface3: '#272b35',
    text: '#e8eaef', text2: '#a8adb8', text3: '#6b7280',
    accent: '#6366f1', accentSoft: 'rgba(99,102,241,0.14)',
    border: 'rgba(255,255,255,0.08)', borderStrong: 'rgba(255,255,255,0.16)',
    zone: { battle:'#ef4444', mana:'#10b981', shield:'#f59e0b', graveyard:'#a78bfa', deck:'#06b6d4', hand:'#14b8a6', temp:'#6b7280' },
    shadow1: '0 1px 2px rgba(0,0,0,0.4)',
    shadow2: '0 4px 12px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.5)',
    shadow3: '0 12px 32px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.5)',
  },
  dawn: {
    canvas: '#f5f1ec', bg: '#faf7f2', surface: '#ffffff', surface2: '#f5f0e8', surface3: '#ede6da',
    text: '#2a251f', text2: '#6b5d4f', text3: '#9a8a78',
    accent: '#c96442', accentSoft: 'rgba(201,100,66,0.12)',
    border: 'rgba(60,40,20,0.10)', borderStrong: 'rgba(60,40,20,0.20)',
    zone: { battle:'#b8453a', mana:'#5b8a3a', shield:'#c98a1f', graveyard:'#8b6db5', deck:'#4a7e9c', hand:'#3d8c8c', temp:'#8a7a68' },
    shadow1: '0 1px 2px rgba(60,40,20,0.06)',
    shadow2: '0 4px 12px rgba(60,40,20,0.08), 0 1px 2px rgba(60,40,20,0.04)',
    shadow3: '0 16px 40px rgba(60,40,20,0.12), 0 2px 8px rgba(60,40,20,0.06)',
  },
};

// Default zone layout (positions/sizes on canvas). GameProfile.layout
// overrides; missing fields fall through to these defaults.
export type ZoneId = 'battle'|'mana'|'shield'|'graveyard'|'deck'|'hand'|'temp';
export interface ZoneLayout { id: ZoneId | string; title: string; x: number; y: number; w: number; h: number; variant: 'tiles'|'pile'|'list' }

export const DEFAULT_LAYOUT: ZoneLayout[] = [
  { id:'battle',    title:'Battle',    x:280, y: 80, w:460, h:220, variant:'tiles' },
  { id:'mana',      title:'Mana',      x:280, y:320, w:460, h:180, variant:'tiles' },
  { id:'shield',    title:'Shield',    x:280, y:520, w:280, h:180, variant:'tiles' },
  { id:'graveyard', title:'Graveyard', x:580, y:520, w:160, h:180, variant:'pile'  },
  { id:'deck',      title:'Deck',      x:760, y: 80, w:160, h:220, variant:'pile'  },
  { id:'temp',      title:'Temp',      x:760, y:320, w:160, h:180, variant:'list'  },
];

export function setTone(t: Tone) {
  document.documentElement.dataset.tone = t;
  localStorage.setItem('tcg-tone', t);
}

export function getInitialTone(): Tone {
  const saved = localStorage.getItem('tcg-tone') as Tone | null;
  return saved && TONES.includes(saved) ? saved : 'dusk';
}
