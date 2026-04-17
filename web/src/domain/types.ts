export interface Card {
  id: string
  name: string
  image_path: string    // 旧形式後方互換用（新カードは ""）
  image_data?: string   // base64 data URL（新形式）
  mana: number
  civilizations: string[]
  card_type: string
  count: number
}

export interface DeckEntry {
  cardId: string
  count: number
}

export interface DeckRecord {
  name: string
  cards: DeckEntry[]
}

export interface DeckPoolJson {
  pool: Card[]
  decks: DeckRecord[]
}

export interface GameCard {
  instanceId: string
  card: Card
  tapped: boolean
  face_down: boolean
  revealed: boolean
  row: 0 | 1
  marker: string | null
  under_cards: GameCard[]
}

export interface Zone {
  zoneId: string
  cards: GameCard[]
}

export interface GridPos {
  col: number
  row: number
  col_span: number
  row_span: number
}

export interface ZoneDefinition {
  id: string
  name: string
  window_id: string
  grid_pos: GridPos
  visibility: 'public' | 'private'
  pile_mode: boolean
  tappable: boolean
  card_scale: number
  two_row: boolean
  masked: boolean
  source_zone_id?: string
  ui_widget?: string
}

export interface WindowDefinition {
  id: string
  title: string
  width: number
  height: number
  grid_cols: number
  grid_rows: number
}

export interface GameConfigJson {
  windows: WindowDefinition[]
  zones: ZoneDefinition[]
}

export interface GameStateSnapshot {
  zones: Record<string, Zone>
}

export type ActionLogEntry = {
  id: string
  message: string
  timestamp: number
}
