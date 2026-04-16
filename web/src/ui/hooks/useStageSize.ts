import { useState, useEffect, useRef } from 'react'

export function useStageSize(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    ro.observe(el)
    setSize({ width: el.clientWidth, height: el.clientHeight })
    return () => ro.disconnect()
  }, [containerRef])

  return size
}

export function gridToPixel(
  gridPos: { col: number; row: number; col_span: number; row_span: number },
  gridCols: number,
  gridRows: number,
  stageW: number,
  stageH: number,
) {
  const cellW = stageW / gridCols
  const cellH = stageH / gridRows
  return {
    x: gridPos.col * cellW,
    y: gridPos.row * cellH,
    width: gridPos.col_span * cellW,
    height: gridPos.row_span * cellH,
  }
}
