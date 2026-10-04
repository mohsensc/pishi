import { useSyncExternalStore } from 'react'

export type TreeHighlight = 'none' | 'hovered' | 'faded' | 'hoveredFaded'

type Listener = () => void

const listeners = new Set<Listener>()
let hoveredTreeId: string | null = null
let fadedTreeIds = new Set<string>()
let fadedKey = ''

function notify(): void {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setHoveredTree(treeId: string | null): void {
  if (treeId === hoveredTreeId) return
  hoveredTreeId = treeId
  notify()
}

export function setFadedTrees(treeIds: readonly string[]): void {
  const key = [...treeIds].sort().join('|')
  if (key === fadedKey) return
  fadedKey = key
  fadedTreeIds = new Set(treeIds)
  notify()
}

export function highlightOf(treeId: string): TreeHighlight {
  const hovered = hoveredTreeId === treeId
  const faded = fadedTreeIds.has(treeId)
  if (hovered && faded) return 'hoveredFaded'
  if (hovered) return 'hovered'
  return faded ? 'faded' : 'none'
}

export function useTreeHighlight(treeId: string): TreeHighlight {
  return useSyncExternalStore(subscribe, () => highlightOf(treeId), () => 'none')
}
