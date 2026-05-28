import type { FieldDef, GameConfigJson } from '../domain/types'

export interface GameTemplate {
  id: string
  name: string
  icon: string
  description: string
  deckRules: { maxDeckSize?: number; maxCopies?: number }
  fieldDefs: FieldDef[]
  boardConfig: GameConfigJson
}

const HAND_WINDOW = {
  id: 'hand',
  title: '手札・デッキ（非公開）',
  width: 540,
  height: 720,
  grid_cols: 6,
  grid_rows: 12,
}

const HAND_ZONES = [
  {
    id: 'hand',
    name: '手札',
    window_id: 'hand',
    grid_pos: { col: 0, row: 0, col_span: 6, row_span: 5 },
    visibility: 'private' as const,
    pile_mode: false,
    tappable: false,
    card_scale: 1.0,
    two_row: false,
    masked: false,
    show_face_up: true,
  },
  {
    id: 'temp',
    name: '保留',
    window_id: 'hand',
    grid_pos: { col: 0, row: 5, col_span: 6, row_span: 3 },
    visibility: 'private' as const,
    pile_mode: false,
    tappable: false,
    card_scale: 1.0,
    two_row: false,
    masked: false,
  },
  {
    id: 'deck_list',
    name: 'デッキカード一覧',
    window_id: 'hand',
    grid_pos: { col: 0, row: 8, col_span: 6, row_span: 4 },
    visibility: 'private' as const,
    pile_mode: false,
    tappable: false,
    card_scale: 1.0,
    two_row: false,
    masked: false,
    ui_widget: 'deck_list',
  },
]

// ── デュエルマスターズ ────────────────────────────────────────────────────────
const DM: GameTemplate = {
  id: 'duel-masters',
  name: 'デュエルマスターズ',
  icon: 'DM',
  description: '山札40枚・シールド5枚・マナゾーン・バトルゾーン',
  deckRules: { maxDeckSize: 40, maxCopies: 4 },
  fieldDefs: [
    { id: 'cost',      label: 'コスト',     type: 'number',       sortable: true,  filterable: false },
    { id: 'power',     label: 'パワー',     type: 'number',       sortable: true,  filterable: false },
    { id: 'card_type', label: 'カード種類', type: 'select',       options: ['クリーチャー', '呪文', 'フィールド', '城'], filterable: true },
    { id: 'attribute', label: '文明',       type: 'multi-select', options: ['光', '水', '闇', '火', '自然'], filterable: true },
    { id: 'rarity',    label: 'レアリティ', type: 'select',       options: ['C', 'U', 'R', 'VR', 'SR', 'GSR'], filterable: true },
    { id: 'set',       label: 'セット',     type: 'text',         filterable: true },
  ],
  boardConfig: {
    windows: [
      { id: 'board', title: 'フィールド（公開）', width: 960, height: 780, grid_cols: 12, grid_rows: 10 },
      HAND_WINDOW,
    ],
    zones: [
      // row 0-3: バトルゾーン（全幅・大）
      {
        id: 'battle', name: 'バトルゾーン', window_id: 'board',
        grid_pos: { col: 0, row: 0, col_span: 12, row_span: 4 },
        visibility: 'public', pile_mode: false, tappable: true, card_scale: 1.2, two_row: true, masked: false,
      },
      // row 4-6: シールド（左）・山札（中）・墓地（右）
      {
        id: 'shield', name: 'シールド', window_id: 'board',
        grid_pos: { col: 0, row: 4, col_span: 6, row_span: 3 },
        visibility: 'private', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      {
        id: 'deck', name: '山札', window_id: 'board',
        grid_pos: { col: 6, row: 4, col_span: 3, row_span: 3 },
        visibility: 'private', pile_mode: true, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      {
        id: 'graveyard', name: '墓地', window_id: 'board',
        grid_pos: { col: 9, row: 4, col_span: 3, row_span: 3 },
        visibility: 'public', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      // row 7-9: マナゾーン（左）・手札表示（右）
      {
        id: 'mana', name: 'マナゾーン', window_id: 'board',
        grid_pos: { col: 0, row: 7, col_span: 10, row_span: 3 },
        visibility: 'public', pile_mode: false, tappable: true, card_scale: 1.0, two_row: false, masked: false,
      },
      {
        id: 'hand_view', name: '手札', window_id: 'board',
        grid_pos: { col: 10, row: 7, col_span: 2, row_span: 3 },
        visibility: 'private', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: true,
        source_zone_id: 'hand',
      },
      ...HAND_ZONES,
    ],
  },
}

// ── 遊戯王 ──────────────────────────────────────────────────────────────────
const YUGIOH: GameTemplate = {
  id: 'yugioh',
  name: '遊戯王OCG',
  icon: 'YGO',
  description: '最大60枚・エクストラデッキ15枚・5枠モンスター/魔法罠ゾーン',
  deckRules: { maxDeckSize: 60, maxCopies: 3 },
  fieldDefs: [
    { id: 'card_type',    label: 'カード種類',   type: 'select',       options: ['通常モンスター', '効果モンスター', '融合モンスター', 'シンクロモンスター', 'エクシーズモンスター', 'リンクモンスター', 'ペンデュラムモンスター', '儀式モンスター', '通常魔法', '永続魔法', '装備魔法', 'フィールド魔法', '速攻魔法', '儀式魔法', '通常罠', '永続罠', 'カウンター罠'], filterable: true },
    { id: 'attribute',    label: '属性',         type: 'select',       options: ['光', '闇', '炎', '水', '風', '地', '神'], filterable: true },
    { id: 'level',        label: 'レベル/ランク', type: 'number',       sortable: true, filterable: false },
    { id: 'atk',         label: 'ATK',          type: 'number',       sortable: true, filterable: false },
    { id: 'def',         label: 'DEF',          type: 'number',       sortable: true, filterable: false },
    { id: 'rarity',      label: 'レアリティ',   type: 'select',       options: ['N', 'R', 'SR', 'UR', 'SE', 'P'], filterable: true },
    { id: 'set',         label: 'パック',        type: 'text',         filterable: true },
  ],
  boardConfig: {
    windows: [
      { id: 'board', title: 'フィールド（公開）', width: 960, height: 780, grid_cols: 12, grid_rows: 10 },
      HAND_WINDOW,
    ],
    zones: [
      // row 0-3: エクストラデッキ（左）・モンスターゾーン（中）・墓地（右）
      {
        id: 'extra_deck', name: 'エクストラデッキ', window_id: 'board',
        grid_pos: { col: 0, row: 0, col_span: 2, row_span: 4 },
        visibility: 'private', pile_mode: true, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      {
        id: 'monster', name: 'モンスターゾーン', window_id: 'board',
        grid_pos: { col: 2, row: 0, col_span: 8, row_span: 4 },
        visibility: 'public', pile_mode: false, tappable: true, card_scale: 1.2, two_row: false, masked: false,
      },
      {
        id: 'graveyard', name: '墓地', window_id: 'board',
        grid_pos: { col: 10, row: 0, col_span: 2, row_span: 4 },
        visibility: 'public', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      // row 4-7: フィールドゾーン（左）・魔法罠ゾーン（中）・メインデッキ（右）
      {
        id: 'field_zone', name: 'フィールドゾーン', window_id: 'board',
        grid_pos: { col: 0, row: 4, col_span: 2, row_span: 4 },
        visibility: 'public', pile_mode: false, tappable: true, card_scale: 1.0, two_row: false, masked: false,
      },
      {
        id: 'spell_trap', name: '魔法・罠ゾーン', window_id: 'board',
        grid_pos: { col: 2, row: 4, col_span: 8, row_span: 4 },
        visibility: 'public', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      {
        id: 'main_deck', name: 'メインデッキ', window_id: 'board',
        grid_pos: { col: 10, row: 4, col_span: 2, row_span: 4 },
        visibility: 'private', pile_mode: true, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      // row 8-9: 除外ゾーン（左広め）・手札表示（右端）
      {
        id: 'banish', name: '除外ゾーン', window_id: 'board',
        grid_pos: { col: 0, row: 8, col_span: 10, row_span: 2 },
        visibility: 'public', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      {
        id: 'hand_view', name: '手札', window_id: 'board',
        grid_pos: { col: 10, row: 8, col_span: 2, row_span: 2 },
        visibility: 'private', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: true,
        source_zone_id: 'hand',
      },
      ...HAND_ZONES,
    ],
  },
}

// ── ポケモンカードゲーム ──────────────────────────────────────────────────────
const POKEMON: GameTemplate = {
  id: 'pokemon',
  name: 'ポケモンカードゲーム',
  icon: 'PKM',
  description: '山札60枚・サイド6枚・アクティブ/ベンチ・スタジアム',
  deckRules: { maxDeckSize: 60, maxCopies: 4 },
  fieldDefs: [
    { id: 'card_type',   label: 'カード種類', type: 'select',       options: ['ポケモン', 'グッズ', 'サポート', 'スタジアム', '基本エネルギー', '特殊エネルギー'], filterable: true },
    { id: 'pokemon_type', label: 'タイプ',    type: 'multi-select', options: ['草', '炎', '水', '雷', '超', '闘', '悪', '鋼', 'フェアリー', '無色', 'ドラゴン'], filterable: true },
    { id: 'hp',          label: 'HP',         type: 'number',       sortable: true, filterable: false },
    { id: 'stage',       label: '進化段階',   type: 'select',       options: ['たね', '1進化', '2進化', 'たねex', 'たねV', 'VMAX', 'VSTAR', 'テラスタル'], filterable: true },
    { id: 'rarity',      label: 'レアリティ', type: 'select',       options: ['C', 'U', 'R', 'RR', 'SR', 'UR', 'CSR', 'SAR'], filterable: true },
    { id: 'set',         label: '拡張パック', type: 'text',         filterable: true },
  ],
  boardConfig: {
    windows: [
      { id: 'board', title: 'フィールド（公開）', width: 960, height: 780, grid_cols: 12, grid_rows: 10 },
      HAND_WINDOW,
    ],
    zones: [
      {
        id: 'prize', name: 'サイドカード', window_id: 'board',
        grid_pos: { col: 0, row: 0, col_span: 3, row_span: 6 },
        visibility: 'private', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      {
        id: 'stadium', name: 'スタジアム', window_id: 'board',
        grid_pos: { col: 3, row: 0, col_span: 6, row_span: 2 },
        visibility: 'public', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      {
        id: 'active', name: 'アクティブスポット', window_id: 'board',
        grid_pos: { col: 3, row: 2, col_span: 6, row_span: 4 },
        visibility: 'public', pile_mode: false, tappable: true, card_scale: 1.5, two_row: false, masked: false,
      },
      {
        id: 'deck', name: '山札', window_id: 'board',
        grid_pos: { col: 9, row: 0, col_span: 3, row_span: 3 },
        visibility: 'private', pile_mode: true, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      {
        id: 'discard', name: 'トラッシュ', window_id: 'board',
        grid_pos: { col: 9, row: 3, col_span: 3, row_span: 3 },
        visibility: 'public', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      {
        id: 'bench', name: 'ベンチ', window_id: 'board',
        grid_pos: { col: 0, row: 6, col_span: 10, row_span: 4 },
        visibility: 'public', pile_mode: false, tappable: true, card_scale: 1.0, two_row: false, masked: false,
      },
      {
        id: 'hand_view', name: '手札', window_id: 'board',
        grid_pos: { col: 10, row: 6, col_span: 2, row_span: 4 },
        visibility: 'private', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: true,
        source_zone_id: 'hand',
      },
      ...HAND_ZONES,
    ],
  },
}

// ── Magic: The Gathering ─────────────────────────────────────────────────────
const MTG: GameTemplate = {
  id: 'mtg',
  name: 'Magic: The Gathering',
  icon: 'MTG',
  description: '最大60枚・戦場/土地/墓地/追放ゾーン・統率領域',
  deckRules: { maxDeckSize: 60, maxCopies: 4 },
  fieldDefs: [
    { id: 'card_type',  label: 'カード種類',   type: 'select',       options: ['クリーチャー', 'インスタント', 'ソーサリー', 'エンチャント', 'アーティファクト', '土地', 'プレインズウォーカー', 'バトル'], filterable: true },
    { id: 'mana_cost',  label: 'マナ・コスト', type: 'text',         filterable: false },
    { id: 'power',      label: 'パワー',       type: 'number',       sortable: true, filterable: false },
    { id: 'toughness',  label: 'タフネス',     type: 'number',       sortable: true, filterable: false },
    { id: 'color',      label: '色',           type: 'multi-select', options: ['白', '青', '黒', '赤', '緑', '無色', '多色'], filterable: true },
    { id: 'rarity',     label: 'レアリティ',   type: 'select',       options: ['C', 'U', 'R', 'M'], filterable: true },
    { id: 'set',        label: 'セット',       type: 'text',         filterable: true },
  ],
  boardConfig: {
    windows: [
      { id: 'board', title: 'フィールド（公開）', width: 960, height: 780, grid_cols: 12, grid_rows: 10 },
      HAND_WINDOW,
    ],
    zones: [
      {
        id: 'battlefield', name: '戦場', window_id: 'board',
        grid_pos: { col: 0, row: 0, col_span: 10, row_span: 5 },
        visibility: 'public', pile_mode: false, tappable: true, card_scale: 1.0, two_row: true, masked: false,
      },
      {
        id: 'library', name: 'ライブラリー', window_id: 'board',
        grid_pos: { col: 10, row: 0, col_span: 2, row_span: 3 },
        visibility: 'private', pile_mode: true, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      {
        id: 'graveyard', name: '墓地', window_id: 'board',
        grid_pos: { col: 10, row: 3, col_span: 2, row_span: 3 },
        visibility: 'public', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      // row 5-9 左: 土地ゾーン（下まで伸ばす）
      {
        id: 'lands', name: '土地ゾーン', window_id: 'board',
        grid_pos: { col: 0, row: 5, col_span: 6, row_span: 5 },
        visibility: 'public', pile_mode: false, tappable: true, card_scale: 1.0, two_row: false, masked: false,
      },
      // row 5-9 中: 追放ゾーン（下まで伸ばす）
      {
        id: 'exile', name: '追放ゾーン', window_id: 'board',
        grid_pos: { col: 6, row: 5, col_span: 4, row_span: 5 },
        visibility: 'public', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      // row 6-7 右端: 統率領域
      {
        id: 'command', name: '統率領域', window_id: 'board',
        grid_pos: { col: 10, row: 6, col_span: 2, row_span: 2 },
        visibility: 'public', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: false,
      },
      // row 8-9 右端: 手札表示（余りスペース）
      {
        id: 'hand_view', name: '手札', window_id: 'board',
        grid_pos: { col: 10, row: 8, col_span: 2, row_span: 2 },
        visibility: 'private', pile_mode: false, tappable: false, card_scale: 1.0, two_row: false, masked: true,
        source_zone_id: 'hand',
      },
      ...HAND_ZONES,
    ],
  },
}

export const GAME_TEMPLATES: GameTemplate[] = [DM, YUGIOH, POKEMON, MTG]
