import Particle from './Particle'
import type { EffectViewProps } from './effectView'

const ringDelays = [0, 0.14]

export default function BounceRing({ effect, scale, lift }: EffectViewProps) {
  const width = 56 * scale * Math.max(0.6, Math.min(1.4, effect.intensity))
  return (
    <>
      {ringDelays.map((delay) => (
        <Particle
          key={delay}
          size={width}
          height={width * 0.36}
          style={{ border: `${Math.max(1.5, 2.4 * scale)}px solid rgba(255, 255, 240, 0.75)`, borderRadius: '50%' }}
          initial={{ y: -lift, scale: 0.3, opacity: 0 }}
          animate={{ y: -lift, scale: [0.3, 1.2, 1.9], opacity: [0, 0.85, 0] }}
          transition={{ duration: 0.75, delay, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}
