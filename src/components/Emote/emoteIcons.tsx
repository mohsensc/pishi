import type { JSX } from 'react'
import type { CatEmote } from '../../game/types'

const emoteColors: Record<CatEmote, string> = {
  startled: '#e2553b',
  curious: '#3b7fd4',
  love: '#e4506a',
  sleepy: '#6879b4',
  annoyed: '#d33f35',
  playful: '#eba820',
  proud: '#dca21c',
}

function StartledIcon({ color }: { color: string }) {
  return (
    <g stroke={color} strokeWidth={2.6} strokeLinecap="round" fill="none">
      <path d="M12 4 L12 12" />
      <path d="M5.5 7 L8.5 12" />
      <path d="M18.5 7 L15.5 12" />
      <circle cx={12} cy={17.5} r={1.2} fill={color} stroke="none" />
    </g>
  )
}

function CuriousIcon({ color }: { color: string }) {
  return (
    <g stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M8.2 8.6 C8.2 5.8 10 4.4 12.2 4.4 C14.6 4.4 16.2 6 16.2 8 C16.2 10.4 12.6 10.8 12.4 14" />
      <circle cx={12.4} cy={18.6} r={1.3} fill={color} stroke="none" />
    </g>
  )
}

function LoveIcon({ color }: { color: string }) {
  return <path d="M12 19.5 C6 15.2 3.6 12.4 3.6 9.2 C3.6 6.6 5.6 4.8 7.9 4.8 C9.6 4.8 11 5.8 12 7.2 C13 5.8 14.4 4.8 16.1 4.8 C18.4 4.8 20.4 6.6 20.4 9.2 C20.4 12.4 18 15.2 12 19.5 Z" fill={color} />
}

function SleepyIcon({ color }: { color: string }) {
  return (
    <g stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M4.5 11 H10.5 L4.5 18 H10.5" />
      <path d="M13.5 5 H18.5 L13.5 10.5 H18.5" />
    </g>
  )
}

function AnnoyedIcon({ color }: { color: string }) {
  return (
    <g stroke={color} strokeWidth={2.4} strokeLinecap="round" fill="none">
      <path d="M10 4.5 C10 8 8 10 4.5 10" />
      <path d="M14 4.5 C14 8 16 10 19.5 10" />
      <path d="M10 19.5 C10 16 8 14 4.5 14" />
      <path d="M14 19.5 C14 16 16 14 19.5 14" />
    </g>
  )
}

function PlayfulIcon({ color }: { color: string }) {
  return (
    <g fill={color}>
      <path d="M11 3 C11.6 8.2 13 9.6 18 10.4 C13 11.2 11.6 12.6 11 18 C10.4 12.6 9 11.2 4 10.4 C9 9.6 10.4 8.2 11 3 Z" />
      <path d="M18 14.5 C18.3 16.4 18.8 16.9 20.6 17.2 C18.8 17.5 18.3 18 18 19.9 C17.7 18 17.2 17.5 15.4 17.2 C17.2 16.9 17.7 16.4 18 14.5 Z" />
    </g>
  )
}

function ProudIcon({ color }: { color: string }) {
  return (
    <g>
      <path d="M4 17.5 L3.2 7.6 L8.4 11.4 L12 5 L15.6 11.4 L20.8 7.6 L20 17.5 Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth={1.2} />
      <circle cx={12} cy={13.6} r={1.5} fill="#ffffff" opacity={0.85} />
    </g>
  )
}

const emoteIcons: Record<CatEmote, (props: { color: string }) => JSX.Element> = {
  startled: StartledIcon,
  curious: CuriousIcon,
  love: LoveIcon,
  sleepy: SleepyIcon,
  annoyed: AnnoyedIcon,
  playful: PlayfulIcon,
  proud: ProudIcon,
}

export default function EmoteIcon({ emote }: { emote: CatEmote }) {
  const Icon = emoteIcons[emote]
  return <Icon color={emoteColors[emote]} />
}
