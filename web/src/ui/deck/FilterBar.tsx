import { useLibraryStore } from '../../store/libraryStore'
import type { Card, FieldDef } from '../../domain/types'

export interface FilterState {
  query: string
  sort: string                       // 'name' | FieldDef.id
  filters: Record<string, string>   // fieldDef.id -> 選択値（'' = すべて）
}

export function buildDefaultFilter(): FilterState {
  return { query: '', sort: 'name', filters: {} }
}

export const DEFAULT_FILTER: FilterState = buildDefaultFilter()

/** cards から各フィールドの実際の値を収集する */
function collectFieldValues(cards: Card[], fieldId: string): string[] {
  const set = new Set<string>()
  for (const c of cards) {
    const v = c.fields[fieldId]
    if (v === undefined || v === null) continue
    if (Array.isArray(v)) {
      v.forEach(item => set.add(String(item)))
    } else {
      set.add(String(v))
    }
  }
  return [...set].sort()
}

/** カード一覧をフィルタ＆ソートして返す純粋関数 */
export function applyFilters(cards: Card[], filter: FilterState, fieldDefs: FieldDef[]): Card[] {
  return cards
    .filter(card => {
      if (filter.query && !card.name.toLowerCase().includes(filter.query.toLowerCase())) return false
      for (const [fieldId, value] of Object.entries(filter.filters)) {
        if (!value) continue
        const fieldVal = card.fields[fieldId]
        if (fieldVal === undefined || fieldVal === null) return false
        const def = fieldDefs.find(f => f.id === fieldId)
        if (!def) continue
        if (def.type === 'multi-select') {
          if (!Array.isArray(fieldVal) || !fieldVal.includes(value)) return false
        } else {
          if (String(fieldVal) !== value) return false
        }
      }
      return true
    })
    .sort((a, b) => {
      if (filter.sort === 'name') return a.name.localeCompare(b.name)
      const va = a.fields[filter.sort] ?? 0
      const vb = b.fields[filter.sort] ?? 0
      if (typeof va === 'number' && typeof vb === 'number') return va - vb
      return String(va).localeCompare(String(vb))
    })
}

interface Props {
  cards: Card[]
  filter: FilterState
  onChange: (f: FilterState) => void
  onAddCard?: () => void
}

const sel: React.CSSProperties = {
  background: '#0e1228',
  color: '#A78BFA',
  border: '1px solid rgba(124,58,237,0.4)',
  borderRadius: 4,
  padding: '3px 6px',
  fontFamily: "'Chakra Petch', sans-serif",
  fontSize: 11,
  cursor: 'pointer',
}

export function FilterBar({ cards, filter, onChange, onAddCard }: Props) {
  const fieldDefs = useLibraryStore(s => s.fieldDefs)

  const set = (partial: Partial<FilterState>) => onChange({ ...filter, ...partial })
  const setFieldFilter = (fieldId: string, value: string) =>
    onChange({ ...filter, filters: { ...filter.filters, [fieldId]: value } })

  // sortable なフィールド
  const sortableFields = fieldDefs.filter(f => f.sortable)

  // filterable なフィールド
  const filterableFields = fieldDefs.filter(f => f.filterable)

  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '6px 8px',
      background: '#060810',
      borderBottom: '1px solid rgba(124,58,237,0.15)',
      flexWrap: 'wrap',
      alignItems: 'center',
      flexShrink: 0,
    }}>
      <input
        type="text"
        placeholder="カード名で検索..."
        value={filter.query}
        onChange={e => set({ query: e.target.value })}
        style={{ ...sel, color: '#E2E8F0', width: 140 }}
      />

      <select value={filter.sort} onChange={e => set({ sort: e.target.value })} style={sel}>
        <option value="name">名前順</option>
        {sortableFields.map(f => (
          <option key={f.id} value={f.id}>{f.label}昇順</option>
        ))}
      </select>

      {filterableFields.map(f => {
        const currentValue = filter.filters[f.id] ?? ''
        let options: string[]
        if (f.type === 'select' || f.type === 'multi-select') {
          options = f.options ?? []
        } else {
          // number / text: カードプールから実際の値を収集
          options = collectFieldValues(cards, f.id)
        }
        return (
          <select
            key={f.id}
            value={currentValue}
            onChange={e => setFieldFilter(f.id, e.target.value)}
            style={sel}
          >
            <option value="">{f.label}:全</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      })}

      <button
        onClick={() => onChange(buildDefaultFilter())}
        style={{ ...sel, color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        リセット
      </button>

      {onAddCard && (
        <button
          onClick={onAddCard}
          style={{
            ...sel,
            color: '#44ddbb',
            border: '1px solid rgba(0,200,150,0.5)',
            marginLeft: 'auto',
          }}
        >
          + ADD
        </button>
      )}
    </div>
  )
}
