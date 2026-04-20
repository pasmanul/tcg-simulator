export interface FieldDef {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'multi-select'
  options?: string[]      // select / multi-select のみ
  default?: any
  sortable?: boolean
  filterable?: boolean
}

export interface Card {
  id: string
  name: string
  image_path: string      // 後方互換のため維持（空文字可）
  image_data?: string     // base64 data URL
  count: number
  fields: Record<string, any>  // FieldDef.id をキー
}

export interface DeckEntry {
  cardId: string
  count: number
}

export interface DeckRecord {
  name: string
  cards: DeckEntry[]
  cardBack?: string  // base64 data URL（デッキ固有の裏面画像）
}

export interface GameProfile {
  meta: { name: string; version?: string }
  fieldDefs: FieldDef[]
  deckRules?: { maxDeckSize?: number; maxCopies?: number }
  boardConfig: GameConfigJson
  pool: Card[]
  decks: DeckRecord[]
}

export interface GameCard {
  instanceId: string
  card: Card
  tapped: boolean
  face_down: boolean
  revealed: boolean
  row: number
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
  row_count?: number
  masked: boolean
  show_face_up?: boolean   // 強制表面表示（masked より優先、手札ゾーン等）
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
