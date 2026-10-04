import type { DragHit, Vec } from '../../game/types'
import type { WorldActions } from '../useWorld'

const interfaceSelector = 'button, [data-ui]'
const discardSelector = '[data-discard-zone], nav[data-ui]'

function elementOfTarget(target: EventTarget | null): Element | null {
  return target instanceof Element ? target : null
}

function isBareSvgRoot(element: Element): boolean {
  return element instanceof SVGSVGElement && element.ownerSVGElement === null
}

export function paintedElementAt(target: EventTarget | null, clientX: number, clientY: number): Element | null {
  const element = elementOfTarget(target)
  if (!element || !isBareSvgRoot(element) || typeof document.elementsFromPoint !== 'function') return element
  return document.elementsFromPoint(clientX, clientY).find((candidate) => !isBareSvgRoot(candidate)) ?? null
}

export function isInterfaceElement(element: Element | null): boolean {
  return element?.closest(interfaceSelector) != null
}

function domHit(element: Element | null): DragHit | null {
  const catId = element?.closest<HTMLElement>('[data-cat-id]')?.dataset.catId
  if (catId) return { target: 'cat', id: catId }
  const propId = element?.closest<HTMLElement>('[data-prop-id]')?.dataset.propId
  return propId ? { target: 'prop', id: propId } : null
}

export function catIdAt(element: Element | null): string | null {
  return element?.closest<HTMLElement>('[data-cat-id]')?.dataset.catId ?? null
}

function isFixedProp(element: Element | null): boolean {
  return element?.closest<HTMLElement>('[data-prop-id]')?.dataset.propKind === 'tree' && element.closest('[data-cat-id]') === null
}

export function resolvePressHit(element: Element | null, point: Vec, actions: WorldActions): DragHit | null {
  const geometric = actions.hitTestDraggable(point)
  if (geometric && (geometric.target === 'ball' || geometric.target === 'treat')) return geometric
  if (isFixedProp(element)) return geometric
  return domHit(element) ?? geometric
}

export function pokeAt(element: Element | null, point: Vec, actions: WorldActions): void {
  const hit = domHit(element)
  if (hit?.target === 'cat') actions.pokeCat(hit.id, point)
  else if (hit?.target === 'prop') actions.pokeProp(hit.id, point)
  else actions.pokeGround(point)
}

export function isOverDiscardZone(clientX: number, clientY: number): boolean {
  if (typeof document.elementsFromPoint !== 'function') return false
  return document.elementsFromPoint(clientX, clientY).some((element) => element.closest(discardSelector) !== null)
}
