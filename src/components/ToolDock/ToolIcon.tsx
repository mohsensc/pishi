import type { ToolKind } from '../../game/types'

interface ToolIconProps {
  tool: ToolKind
}

const laserRed = '#e5483b'

function IconPaths({ tool }: ToolIconProps) {
  switch (tool) {
    case 'hand':
      return (
        <>
          <path d="M18 11V6a2 2 0 0 0-4 0" />
          <path d="M14 10V4a2 2 0 0 0-4 0v2" />
          <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </>
      )
    case 'treat':
      return (
        <>
          <path d="M3 12c3.2-4.6 9.4-5.4 13.6 0-4.2 5.4-10.4 4.6-13.6 0z" />
          <path d="M16.6 12 21 8.4v7.2z" />
          <circle cx="7.2" cy="11.2" r="0.9" fill="currentColor" stroke="none" />
        </>
      )
    case 'wand':
      return (
        <>
          <path d="M4 21 12.5 6.5" />
          <path d="M12.5 6.5c1.4 3 1.8 6.6.6 10" strokeDasharray="1.6 1.6" />
          <path d="M13.1 16.5c-2.6.8-4.2 3-3.6 5 2.2-.2 4.1-2.2 3.6-5z" />
          <path d="M13.1 16.5c2.4 1.2 3.4 3.5 2.4 5.3-1.9-.7-3-3-2.4-5.3z" />
        </>
      )
    case 'laser':
      return (
        <>
          <path d="m3.5 16.5 7-7 4 4-7 7a2.1 2.1 0 0 1-3 0l-1-1a2.1 2.1 0 0 1 0-3z" />
          <path d="m9 11 4 4" />
          <circle cx="18.5" cy="5.5" r="2.2" fill={laserRed} stroke="none" />
          <path d="M18.5 1.2v1.1M22.8 5.5h-1.1M21.6 2.4l-.8.8" stroke={laserRed} />
        </>
      )
    case 'brush':
      return (
        <>
          <path d="M3.5 20.5 11 13" />
          <rect x="11" y="4.5" width="9" height="6.5" rx="2.2" transform="rotate(45 15.5 7.75)" />
          <path d="M14.2 12.8l-1 1M16.3 10.7l-1 1M18.4 8.6l-1 1" />
        </>
      )
    case 'catnip':
      return (
        <>
          <path d="M5 19c0-8.2 5.2-14 14-14 0 8.8-5.8 14-14 14z" />
          <path d="M5 19 14.5 9.5" />
          <path d="M9.3 14.7h3.4M11.8 12.2v-2.8" />
        </>
      )
  }
}

export default function ToolIcon({ tool }: ToolIconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <IconPaths tool={tool} />
    </svg>
  )
}
