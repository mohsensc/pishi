import { useCallback, useEffect, useRef, useState } from 'react'

const trashSlack = 10

function isInsideElement(element: HTMLElement | null, clientX: number, clientY: number): boolean {
  if (!element) return false
  const bounds = element.getBoundingClientRect()
  return (
    clientX >= bounds.left - trashSlack &&
    clientX <= bounds.right + trashSlack &&
    clientY >= bounds.top - trashSlack &&
    clientY <= bounds.bottom + trashSlack
  )
}

export function useTrashZone(active: boolean): { trashRef: (element: HTMLElement | null) => void; overTrash: boolean } {
  const [overTrash, setOverTrash] = useState(false)
  const trashElementRef = useRef<HTMLElement | null>(null)
  const trashRef = useCallback((element: HTMLElement | null) => {
    trashElementRef.current = element
  }, [])

  useEffect(() => {
    if (!active) return
    const handleMove = (event: PointerEvent) => setOverTrash(isInsideElement(trashElementRef.current, event.clientX, event.clientY))
    window.addEventListener('pointermove', handleMove, true)
    return () => {
      window.removeEventListener('pointermove', handleMove, true)
      setOverTrash(false)
    }
  }, [active])

  return { trashRef, overTrash: active && overTrash }
}
