import { useEffect, useState } from 'react'

export interface ViewportSize {
  width: number
  height: number
}

function readViewportSize(): ViewportSize {
  if (typeof window === 'undefined') return { width: 1280, height: 800 }
  return { width: window.innerWidth, height: window.innerHeight }
}

export function useViewportSize(): ViewportSize {
  const [viewportSize, setViewportSize] = useState<ViewportSize>(readViewportSize)

  useEffect(() => {
    const handleResize = () => setViewportSize(readViewportSize())
    window.addEventListener('resize', handleResize)
    window.visualViewport?.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('resize', handleResize)
    }
  }, [])

  return viewportSize
}
