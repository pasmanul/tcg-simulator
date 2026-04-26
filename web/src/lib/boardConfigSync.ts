import { useLayoutStore } from '../store/layoutStore'
import { useLibraryStore } from '../store/libraryStore'

export function syncBoardConfigToLibrary(): void {
  const { windows, zones } = useLayoutStore.getState()
  const ls = useLibraryStore.getState()
  ls.applyLibrarySnapshot(ls.cards, ls.decks, ls.activeDeckIndex,
    undefined, undefined, { windows, zones })
}
