import { User } from 'lucide-react'
import './Avatar.css'

interface Props {
  /** Image URL. If null/undefined, falls back to initials or icon. */
  src?: string | null
  /** Full name used to generate initials when no image is provided. */
  name?: string
  /** Diameter in pixels. Defaults to 38. */
  size?: number
  className?: string
  title?: string
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function Avatar({ src, name, size = 38, className, title }: Props) {
  const iconSize = Math.round(size * 0.5)

  return (
    <div
      className={`avatar${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size, minWidth: size, fontSize: Math.round(size * 0.33) }}
      title={title}
    >
      {src
        ? <img src={src} alt={name} />
        : name
          ? <span>{initials(name)}</span>
          : <User size={iconSize} />
      }
    </div>
  )
}
