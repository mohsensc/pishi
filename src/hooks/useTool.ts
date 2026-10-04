import { useCallback, useEffect, useState, type RefObject } from 'react'
import type { PointerState, ToolKind } from '../game/types'

export const toolOrder: ToolKind[] = ['hand', 'treat', 'wand', 'laser', 'brush', 'catnip']

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

export function useTool(pointerRef: RefObject<PointerState>): { tool: ToolKind; selectTool: (tool: ToolKind) => void } {
  const [tool, setTool] = useState<ToolKind>('hand')

  useEffect(() => {
    pointerRef.current.tool = tool
  }, [tool, pointerRef])

  const selectTool = useCallback((next: ToolKind) => setTool(next), [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return
      const index = Number(event.key) - 1
      const next = toolOrder[index]
      if (next) setTool(next)
      if (event.key === 'Escape') setTool('hand')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { tool, selectTool }
}
