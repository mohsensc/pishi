import { memo, useEffect, useState, type Ref } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { tierStandingOf } from '../../game/economy/shopGoals'
import RollingAmount from './RollingAmount'
import TokenGlyph from './TokenGlyph'
import type { WalletDelta } from './walletFlights'
import styles from './Wallet.module.css'

interface WalletHudProps {
  shownAmount: number
  wallet: number
  lifetimeEarned: number
  bumpSignal: number
  shakeSignal: number
  deltas: WalletDelta[]
  glyphRef: Ref<HTMLSpanElement>
  onDeltaDone: (deltaId: string) => void
}

const flashMs = 420
const tierBurstRays = 8

function useSignalFlag(signal: number, durationMs: number): boolean {
  const [raisedFor, setRaisedFor] = useState<number | null>(null)
  useEffect(() => {
    if (signal === 0) return
    const raise = window.setTimeout(() => setRaisedFor(signal), 0)
    const lower = window.setTimeout(() => setRaisedFor((current) => (current === signal ? null : current)), durationMs)
    return () => {
      window.clearTimeout(raise)
      window.clearTimeout(lower)
    }
  }, [signal, durationMs])
  return raisedFor === signal
}

function TierBurst({ tier }: { tier: number }) {
  return (
    <span className={styles.tierBurst} aria-hidden="true">
      <motion.span className={styles.tierRing} initial={{ scale: 0.8, opacity: 0.9 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      {Array.from({ length: tierBurstRays }, (_, index) => {
        const angle = (index / tierBurstRays) * Math.PI * 2
        return (
          <motion.span
            key={`${tier}-${index}`}
            className={styles.tierSpark}
            initial={{ x: 0, y: 0, scale: 0.3, opacity: 1 }}
            animate={{ x: Math.cos(angle) * 46, y: Math.sin(angle) * 26, scale: [0.3, 1, 0], opacity: [1, 1, 0] }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.05 }}>
            <TokenGlyph size={9} />
          </motion.span>
        )
      })}
    </span>
  )
}

function WalletHud({ shownAmount, wallet, lifetimeEarned, bumpSignal, shakeSignal, deltas, glyphRef, onDeltaDone }: WalletHudProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const standing = tierStandingOf(lifetimeEarned)
  const [firstTier] = useState(standing.tier)
  const flashing = useSignalFlag(shakeSignal, flashMs)

  useEffect(() => {
    if (bumpSignal === 0 || !scope.current) return
    const element = scope.current
    animate(element, { scale: 1.12 }, { duration: 0.07, ease: 'easeOut' }).then(() => {
      if (element.isConnected) animate(element, { scale: 1 }, { type: 'spring', stiffness: 520, damping: 13 })
    })
  }, [bumpSignal, animate, scope])

  useEffect(() => {
    if (shakeSignal === 0 || !scope.current) return
    animate(scope.current, { x: [0, -4, 4, -4, 4, 0] }, { duration: 0.32, ease: 'easeInOut' })
  }, [shakeSignal, animate, scope])

  const celebrating = standing.tier > firstTier

  return (
    <div className={styles.walletAnchor} data-ui>
      <div ref={scope} className={styles.wallet} data-wallet={wallet} data-tier={standing.tier} data-flash={flashing}>
        <span ref={glyphRef} className={styles.walletGlyph}>
          <TokenGlyph size={20} />
        </span>
        <RollingAmount value={shownAmount} />
        <span className={styles.tierTrack} aria-hidden="true">
          <motion.span className={styles.tierFill} initial={false} animate={{ scaleX: standing.progress }} transition={{ type: 'spring', stiffness: 160, damping: 24 }} />
        </span>
        <span className={styles.tierPips} aria-hidden="true">
          {[1, 2, 3, 4].map((tier) => (
            <motion.span key={tier} className={styles.tierPip} data-reached={standing.tier >= tier} initial={false} animate={{ scale: standing.tier === tier ? [1, 1.8, 1] : 1 }} transition={{ duration: 0.5 }} />
          ))}
        </span>
        <AnimatePresence>{celebrating && <TierBurst key={standing.tier} tier={standing.tier} />}</AnimatePresence>
      </div>
      <div className={styles.deltas} aria-hidden="true">
        <AnimatePresence>
          {deltas.map((delta) => (
            <motion.span
              key={delta.id}
              className={styles.delta}
              data-sign={delta.amount >= 0 ? 'gain' : 'spend'}
              initial={{ opacity: 0, y: -2, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1, 0], y: delta.amount >= 0 ? 8 : 16, scale: 1 }}
              transition={{ duration: 0.95, times: [0, 0.15, 0.7, 1], ease: 'easeOut' }}
              onAnimationComplete={() => onDeltaDone(delta.id)}>
              {delta.amount >= 0 ? `+${delta.amount}` : `−${Math.abs(delta.amount)}`}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default memo(WalletHud)
