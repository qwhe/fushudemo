import { ref } from 'vue'
import type { MemeProject } from '../types/meme'
import { renderMeme } from '../services/memeRenderer'

export function useExport() {
  const exporting = ref(false)

  async function generateExport(project: MemeProject, image: HTMLImageElement): Promise<Blob> {
    if (exporting.value) throw new Error('Already exporting')
    exporting.value = true
    try {
      const canvas = document.createElement('canvas')
      const maxEdge = 800
      const w = image.naturalWidth
      const h = image.naturalHeight
      const scale = maxEdge / Math.max(w, h)
      renderMeme(project, canvas, image, { scale, showGuides: false })
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        }, 'image/jpeg', 0.7)
      })
    } finally {
      exporting.value = false
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = URL.createObjectURL(blob)

    if (isMobile) {
      // Mobile: open in new tab so user can long-press to save
      // Also try download attribute as fallback
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.target = '_blank'
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // Revoke after delay so image has time to load
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } else {
      // Desktop: direct download
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return { exporting, generateExport, downloadBlob }
}
