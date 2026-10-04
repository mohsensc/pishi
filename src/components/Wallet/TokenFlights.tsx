import { memo } from 'react'
import { motion } from 'motion/react'
import TokenGlyph from './TokenGlyph'
import type { FlightSpark, TokenFlight } from './walletFlights'
import styles from './Wallet.module.css'

interface TokenFlightsProps {
  flights: TokenFlight[]
  sparks: FlightSpark[]
  onArrive: (flight: TokenFlight) => void
  onSparkDone: (sparkId: string) => void
}

function FlightGlyph({ flight, onArrive }: { flight: TokenFlight; onArrive: (flight: TokenFlight) => void }) {
  const { from, to, lift } = flight
  const peakX = from.x + (to.x - from.x) * 0.35
  const peakY = Math.min(from.y, to.y) - lift
  const inbound = flight.direction === 'in'
  return (
    <motion.span
      className={styles.flight}
      style={{ width: flight.size, height: flight.size, marginLeft: -flight.size / 2, marginTop: -flight.size / 2 }}
      initial={{ x: from.x, y: from.y, scale: inbound ? 0.4 : 1, opacity: 0, rotate: 0 }}
      animate={{
        x: [from.x, peakX, to.x],
        y: [from.y, peakY, to.y],
        scale: inbound ? [0.4, 1.15, 0.72] : [1, 0.95, 0.4],
        opacity: inbound ? [0, 1, 1] : [1, 1, 0],
        rotate: [0, flight.spin * 0.45, flight.spin],
      }}
      transition={{
        duration: flight.duration,
        delay: flight.delay,
        times: [0, 0.42, 1],
        ease: ['easeOut', 'easeIn'],
      }}
      onAnimationComplete={() => onArrive(flight)}>
      <TokenGlyph size={flight.size} />
    </motion.span>
  )
}

function SparkBurst({ spark, onDone }: { spark: FlightSpark; onDone: (sparkId: string) => void }) {
  return (
    <span className={styles.spark} style={{ transform: `translate3d(${spark.position.x}px, ${spark.position.y}px, 0)` }}>
      {Array.from({ length: spark.rays }, (_, index) => {
        const angle = (index / spark.rays) * Math.PI * 2 - Math.PI / 2
        return (
          <motion.span
            key={index}
            className={styles.sparkRay}
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
            animate={{ x: Math.cos(angle) * 20, y: Math.sin(angle) * 20, scale: [0.4, 1, 0.2], opacity: [1, 1, 0] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            onAnimationComplete={index === 0 ? () => onDone(spark.id) : undefined}
          />
        )
      })}
    </span>
  )
}

function TokenFlights({ flights, sparks, onArrive, onSparkDone }: TokenFlightsProps) {
  return (
    <div className={styles.flightLayer} aria-hidden="true">
      {sparks.map((spark) => (
        <SparkBurst key={spark.id} spark={spark} onDone={onSparkDone} />
      ))}
      {flights.map((flight) => (
        <FlightGlyph key={flight.id} flight={flight} onArrive={onArrive} />
      ))}
    </div>
  )
}

export default memo(TokenFlights)
