# Handoff to Claude Code — Spatial UI

This package replaces the current `web/src/ui/` with a Spatial Canvas UI
where zones are draggable, resizable boxes on an infinite canvas.

## What changes
- **Theme** — replace `web/src/theme.ts` with `theme.ts` in this folder.
  Two tones ship: `dusk` (dark) and `dawn` (light). Existing 4-skin enum
  in the old theme is dropped; switch via `[data-tone]` on `<html>`.
- **CSS** — drop `spatial.css` next to `web/src/index.css` and import it.
- **Components** — new files under `web/src/ui/spatial/`:
  - `ZoneBox.tsx` — draggable/resizable container (replaces zone Groups)
  - `Chrome.tsx` — FloatingToolbar, LayersPanel, InspectorPanel, HandDock,
    CommandPalette, Sheet
  - `Canvas.tsx` — top-level layout shell (replaces `BoardHud.tsx`)
- **Stores** — small addition only:
  - `uiStore`: add `layout: Record<ZoneId, {x,y,w,h}>`, `tone: 'dusk'|'dawn'`,
    `layoutMode: boolean`. Persist `layout` + `tone` to localStorage and
    write back to the open GameProfile JSON on save.
  - `gameStore`: no changes — zone semantics (battle/mana/shield/etc) are
    untouched. Render layer reads `uiStore.layout` for positions.

## What does NOT change
- `gameStore`, `libraryStore`, `BroadcastChannel` multi-window sync,
  `domain/types.ts`, GameProfile schema (extended, not replaced).
- Konva can stay for card rendering inside `ZoneBox` if desired —
  the kit uses DOM cards, but the architecture is identical.

## File map (this folder → repo)
| this package          | place at                                  |
|-----------------------|-------------------------------------------|
| `theme.ts`            | `web/src/theme.ts` (replace)              |
| `spatial.css`         | `web/src/spatial.css` (new)               |
| `ZoneBox.tsx`         | `web/src/ui/spatial/ZoneBox.tsx`          |
| `Chrome.tsx`          | `web/src/ui/spatial/Chrome.tsx`           |
| `Canvas.tsx`          | `web/src/ui/spatial/Canvas.tsx`           |
| `useLayout.ts`        | `web/src/store/useLayout.ts`              |

## Migration steps for Claude Code
1. Snapshot the current `theme.ts` to `theme.legacy.ts` (rollback path).
2. Replace `theme.ts` with the new one; delete the 4-skin enum references.
3. Add `import './spatial.css'` to `web/src/main.tsx` (after `index.css`).
4. Create `web/src/ui/spatial/` folder, drop the three component files.
5. Extend `uiStore.ts` with the new state slice (`layout`, `tone`, `layoutMode`).
6. In `App.tsx`, replace `<BoardHud/>` with `<Canvas/>`. Hand window
   (`hand.html` BroadcastChannel target) gets a new bottom-dock layout
   pointing at the same `gameStore.hand`.
7. Extend GameProfile schema (`domain/types.ts`) with optional `layout` field.
   Migration: missing → defaults from `DEFAULT_LAYOUT` constant.
8. Smoke test: `npm run dev`, init field, move a zone, save, reload.

## Out of scope (call out for follow-up PRs)
- **Multi-zone custom types** — users defining their own zones with
  custom semantics. The data structure supports it (`id` is a string),
  but no UI for it yet. Currently "Add Zone" creates a generic temp zone.
- **Zone-to-zone drag-drop** — currently click cards to move. The
  spatial model makes real drag between zones natural, but it requires
  a global drag coordinator. Out of scope for this PR.
- **Pinch zoom / pan** — canvas is fixed at 1× in the kit. Add via
  CSS transform on the canvas root + wheel/touch handlers.

## Open questions for the team
1. Do we keep the old `theme.ts` 4 skins as `[data-tone]` extensions,
   or fully delete? (Recommendation: delete — the spatial system is a
   clean break.)
2. Should `layout` per-GameProfile or per-user? Currently localStorage
   = per-browser. Save into GameProfile = per-game.
3. Mobile: out of scope, but the layout system makes a touch port
   tractable. Worth planning?
