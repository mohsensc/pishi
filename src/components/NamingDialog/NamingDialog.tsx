import { useMemo, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { motion } from 'motion/react'
import { previewBreedCoat } from '../../game/collar/breedCoat'
import { breedChoices, CAT_NAME_MAX_LENGTH } from '../../game/collar/collarCatalog'
import type { CatBreed, CatState } from '../../game/types'
import BreedGlyph from '../CatCard/BreedGlyph'
import CareItemIcon from '../CareTray/CareItemIcon'
import styles from './NamingDialog.module.css'

interface NamingDialogProps {
  cat: CatState
  onDone: (name: string, breed: CatBreed) => void
}

const breedLabels: Record<CatBreed, string> = {
  tuxedo: 'Tuxedo',
  munchkin: 'Munchkin',
  persian: 'Persian',
  egyptianMau: 'Egyptian Mau',
}

function stopStagePointer(event: PointerEvent<HTMLElement>): void {
  event.stopPropagation()
}

export default function NamingDialog({ cat, onDone }: NamingDialogProps) {
  const [name, setName] = useState(cat.name)
  const [breed, setBreed] = useState<CatBreed>(cat.coat.breed)
  const previews = useMemo(() => breedChoices.map((choice) => ({ breed: choice, coat: previewBreedCoat(cat, choice) })), [cat])

  const finish = () => onDone(name, breed)
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    finish()
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    event.stopPropagation()
    if (event.key === 'Escape') finish()
  }

  return (
    <div className={styles.backdrop} data-ui data-naming-dialog onPointerDown={stopStagePointer} onClick={finish}>
      <motion.form
        className={styles.card}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 12, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}>
        <label className={styles.nameRow}>
          <CareItemIcon kind="collar" size={26} />
          <input
            className={styles.input}
            value={name}
            maxLength={CAT_NAME_MAX_LENGTH}
            onChange={(event) => setName(event.target.value)}
            onFocus={(event) => event.target.select()}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            aria-label="Name"
            placeholder="Name"
          />
        </label>
        <div className={styles.breeds} role="radiogroup" aria-label="Breed">
          {previews.map((preview) => (
            <button
              key={preview.breed}
              type="button"
              role="radio"
              className={styles.breed}
              data-breed-choice={preview.breed}
              data-selected={breed === preview.breed}
              aria-checked={breed === preview.breed}
              aria-label={breedLabels[preview.breed]}
              title={breedLabels[preview.breed]}
              onClick={() => setBreed(preview.breed)}>
              <BreedGlyph coat={preview.coat} size={30} />
            </button>
          ))}
        </div>
        <button type="submit" className={styles.confirm} aria-label="Done" data-naming-confirm>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.4 4.4L19 7.5" />
          </svg>
        </button>
      </motion.form>
    </div>
  )
}
