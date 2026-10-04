import EntryScreen from './components/EntryScreen/EntryScreen'
import Park from './components/Park/Park'
import { useParkSession } from './persistence/useParkSession'
import { useViewportSize } from './hooks/useViewportSize'

export default function App() {
  const viewportSize = useViewportSize()
  const { rememberedOwner, busy, enter, worldSource, generation } = useParkSession()
  if (!worldSource) return <EntryScreen viewportSize={viewportSize} rememberedOwner={rememberedOwner} busy={busy} onEnter={enter} />
  return <Park key={generation} viewportSize={viewportSize} worldSource={worldSource} />
}
