import { useCallback, useEffect, useState, type RefObject } from 'react'
import type { PointerState, ToolKind } from '../game/types'

export const toolOrder: ToolKind[] = ['hand', 'treat', 'wand', 'laser', 'brush', 'catnip']

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

export function useTool(
  pointerRef: RefObject<PointerState>,
  ownedTools: readonly ToolKind[],
  ownsTool: (tool: ToolKind) => boolean,
): { tool: ToolKind; selectTool: (tool: ToolKind) => void } {
  const [chosenTool, setTool] = useState<ToolKind>('hand')
  const tool = chosenTool === 'hand' || ownedTools.includes(chosenTool) ? chosenTool : 'hand'

  useEffect(() => {
    pointerRef.current.tool = tool
  }, [tool, pointerRef])

  const selectTool = useCallback(
    (next: ToolKind) => {
      if (next === 'hand' || ownsTool(next)) setTool(next)
    },
    [ownsTool],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return
      const index = Number(event.key) - 1
      const next = toolOrder[index]
      if (next) selectTool(next)
      if (event.key === 'Escape') setTool('hand')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectTool])

  return { tool, selectTool }
}
