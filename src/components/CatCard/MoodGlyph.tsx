import EmoteIcon from '../Emote/emoteIcons'
import { moodEmotes, type CatMood } from './catMood'

interface MoodGlyphProps {
  mood: CatMood
}

function HungryIcon() {
  return (
    <g fill="none" stroke="#c07a33" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 12.5h17c0 3.9-3.8 6.5-8.5 6.5s-8.5-2.6-8.5-6.5z" />
      <path d="M9 9.5c0-1.4 1-2.4 2-3M14 9.5c0-1.4 1-2.4 2-3" />
    </g>
  )
}

function ContentIcon() {
  return (
    <g fill="none" stroke="#5d9a45" strokeWidth={2.2} strokeLinecap="round">
      <path d="M5.5 10.5c1-1.3 2.4-1.3 3.4 0M15.1 10.5c1-1.3 2.4-1.3 3.4 0" />
      <path d="M8 15c2.2 2.2 5.8 2.2 8 0" />
    </g>
  )
}

export default function MoodGlyph({ mood }: MoodGlyphProps) {
  const emote = moodEmotes[mood]
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      {emote ? <EmoteIcon emote={emote} /> : mood === 'hungry' ? <HungryIcon /> : <ContentIcon />}
    </svg>
  )
}
