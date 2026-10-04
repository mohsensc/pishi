import styles from './ToolDock.module.css'

interface AddButtonProps {
  open: boolean
  onToggle: () => void
}

export default function AddButton({ open, onToggle }: AddButtonProps) {
  return (
    <button type="button" className={styles.toolButton} data-active={open} aria-expanded={open} aria-label="Add items" onClick={onToggle}>
      <svg className={styles.addIcon} data-open={open} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      <span className={styles.tooltip} role="tooltip">
        Add items
      </span>
    </button>
  )
}
