import type { PathBrush } from '../../hooks/useBuildMode'

export function AxeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5.2 20.2 15.4 8.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12.6 5.3c2.4-1.9 5.9-1.6 7.6.9l-4.9 4.9z" fill="currentColor" />
      <path d="M12.6 5.3l2.7 5.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function GravelSwatch({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 21c-1-4 7-5.5 6.5-9.5C13.2 8.6 9.6 7.6 11 3" stroke="#d2bb8b" strokeWidth="7.4" strokeLinecap="round" fill="none" />
      <path d="M7 21c-1-4 7-5.5 6.5-9.5C13.2 8.6 9.6 7.6 11 3" stroke="#e9d8ae" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="8.6" cy="18.4" r="0.8" fill="#b89f6e" />
      <circle cx="12.4" cy="13.6" r="0.7" fill="#b89f6e" />
      <circle cx="11.4" cy="7.6" r="0.7" fill="#c9b180" />
      <circle cx="13.6" cy="10.4" r="0.6" fill="#f7edd2" />
    </svg>
  )
}

export function StoneSwatch({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 16.5l3.2-3.6 5 .6 1.2 4.2-3.4 2.8-5-1z" fill="#e4dfd3" stroke="#aaa18f" strokeWidth="1" strokeLinejoin="round" />
      <path d="M11.5 9.5l3-4.2 4.8.4 1.4 4-3.2 3.4-4.8-.6z" fill="#e4dfd3" stroke="#aaa18f" strokeWidth="1" strokeLinejoin="round" />
      <path d="M6.6 15.2l2.4-.6M13.6 8.4l2.4-.8" stroke="#f6f3ec" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function EraserSwatch({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13.8 4.6l5.6 5.6-8.8 8.8H6.8l-2.6-2.6a1.6 1.6 0 0 1 0-2.2z" fill="#f4c7c0" stroke="#2d3a2a" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.8 9.6l5.6 5.6" stroke="#2d3a2a" strokeWidth="1.5" />
      <path d="M11 19h8" stroke="#2d3a2a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function PathBrushIcon({ brush }: { brush: PathBrush }) {
  if (brush.kind === 'erasePath') return <EraserSwatch />
  return brush.style === 'stone' ? <StoneSwatch /> : <GravelSwatch />
}
