import Park from './components/Park/Park'
import { useViewportSize } from './hooks/useViewportSize'

export default function App() {
  const viewportSize = useViewportSize()
  return <Park viewportSize={viewportSize} />
}
