import { useLibraryStore } from '../../store/libraryStore'
import type { Card, FieldDef } from '../../domain/types'
import { Button } from '../components/Button'

export interface FilterState {
  query: string
  sort: string
  filters: Record<string, string>
}

export function buildDefaultFilter(): FilterState {
  return { query: '', sort: 'name', filters: {} }
}

export const DEFAULT_FILTER: FilterState = buildDefaultFilter()

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
  return [...set].sort((a, b) => {
    const na = Number(a), nb = Number(b)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.localeCompare(b)
  })
}

export function applyFilters(cards: Card[], filter: FilterState, fieldDefs: FieldDef[]): Card[] {
  return cards
    .filter(card => {
      if (filter.query && !card.name.toLowerCase().includes(filter.query.toLowerCase())) return false
      for (const [fieldId, value] of Object.entries(filter.filters)) {
        if (!value) continue
        const def = fieldDefs.find(f => f.id === fieldId)
        if (!def) continue
        const fieldVal = card.fields[fieldId]
        if (fieldVal === undefined || fieldVal === null) return false
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

const selectCls = 'bg-surface2 text-primary-lite border border-border rounded-theme px-2 py-1 font-body text-[11px] cursor-pointer'

export function FilterBar({ cards, filter, onChange, onAddCard }: Props) {
  const fieldDefs = useLibraryStore(s => s.fieldDefs)

  const set = (partial: Partial<FilterState>) => onChange({ ...filter, ...partial })
  const setFieldFilter = (fieldId: string, value: string) =>
    onChange({ ...filter, filters: { ...filter.filters, [fieldId]: value } })

  const sortableFields = fieldDefs.filter(f => f.sortable)
  const filterableFields = fieldDefs.filter(f => f.filterable)

  return (
    <div className="flex gap-1.5 px-2 py-1.5 bg-bg2 border-b border-border flex-wrap items-center flex-shrink-0">
      <input
        type="text"
        placeholder="カード名で検索..."
        value={filter.query}
        onChange={e => set({ query: e.target.value })}
        className="bg-surface2 text-text-base border border-border rounded-theme px-2 py-1 font-body text-[11px] w-[140px] focus:outline-none focus:border-primary"
      />

      <select value={filter.sort} onChange={e => set({ sort: e.target.value })} className={selectCls}>
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
          options = collectFieldValues(cards, f.id)
        }
        return (
          <select
            key={f.id}
            value={currentValue}
            onChange={e => setFieldFilter(f.id, e.target.value)}
            className={selectCls}
          >
            <option value="">{f.label}:全</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      })}

      <Button size="sm" variant="ghost" onClick={() => onChange(buildDefaultFilter())}>
        リセット
      </Button>

      {onAddCard && (
        <Button size="sm" className="ml-auto" onClick={onAddCard}>
          + ADD
        </Button>
      )}
    </div>
  )
}
