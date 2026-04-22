import './ConfirmModal.css'

interface Action {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

interface ConfirmModalProps {
  title: string
  message: string
  actions: Action[]
  onClose: () => void
}

export default function ConfirmModal({ title, message, actions, onClose }: ConfirmModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          {actions.map((a) => (
            <button
              key={a.label}
              className={a.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
              onClick={a.onClick}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
