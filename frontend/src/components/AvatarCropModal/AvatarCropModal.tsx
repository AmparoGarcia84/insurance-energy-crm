/**
 * AvatarCropModal — Profile photo crop and adjust dialog
 *
 * Opens over the page after a file is selected. Uses react-easy-crop so the
 * user can pan and zoom the image before saving. On confirm, the visible area
 * is drawn to a canvas and returned to the caller as a Blob (JPEG 92%).
 */
import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { useTranslation } from 'react-i18next'
import './AvatarCropModal.css'

interface Props {
  /** Object URL of the selected image file. */
  imageSrc: string
  /** Called with the cropped Blob when the user confirms. */
  onSave: (blob: Blob) => Promise<void>
  onClose: () => void
}

/** Draws the visible crop area onto a 400×400 canvas and returns a JPEG Blob. */
async function getCroppedImg(imageSrc: string, cropPixels: Area): Promise<Blob> {
  const image = new Image()
  image.src = imageSrc
  await new Promise<void>(resolve => { image.onload = () => resolve() })

  const OUTPUT = 400
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT
  canvas.height = OUTPUT
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(
    image,
    cropPixels.x, cropPixels.y,
    cropPixels.width, cropPixels.height,
    0, 0, OUTPUT, OUTPUT,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas is empty'))
    }, 'image/jpeg', 0.92)
  })
}

export default function AvatarCropModal({ imageSrc, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleSave() {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      await onSave(blob)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal avatar-crop-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('topbar.cropTitle')}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="modal-title">{t('topbar.cropTitle')}</h2>

        <div className="avatar-crop-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="avatar-crop-zoom">
          <span className="avatar-crop-zoom-label">{t('topbar.cropZoom')}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            aria-label={t('topbar.cropZoom')}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
