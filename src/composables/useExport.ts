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
      const maxEdge = 1600
      const w = image.naturalWidth
      const h = image.naturalHeight
      const scale = maxEdge / Math.max(w, h)
      renderMeme(project, canvas, image, { scale, showGuides: false })
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        }, 'image/png')
      })
    } finally {
      exporting.value = false
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return { exporting, generateExport, downloadBlob }
}
