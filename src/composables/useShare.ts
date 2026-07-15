import { ref, onMounted } from 'vue'

const MIME = 'image/jpeg'
const EXT = 'jpg'

export function useShare() {
  const hasShareAPI = ref(false)
  const supportsFileShare = ref(false)
  const supportsClipboard = ref(false)

  onMounted(() => {
    hasShareAPI.value = typeof navigator.share === 'function'
    supportsFileShare.value = typeof navigator.canShare === 'function'
    supportsClipboard.value = !!(navigator.clipboard && navigator.clipboard.write)
  })

  async function shareWithFallback(blob: Blob, title: string = '鼠鼠嘴替表情包') {
    const file = new File([blob], `opossum-meme.${EXT}`, { type: MIME })

    if (typeof navigator.share === 'function') {
      if (typeof navigator.canShare === 'function') {
        const fileData: ShareData = { title, files: [file] }
        if (navigator.canShare(fileData)) {
          try {
            await navigator.share(fileData)
            return { shared: true }
          } catch (e) {
            if ((e as Error).name === 'AbortError') return { shared: false, aborted: true }
          }
        }
      }
      return { shared: false, aborted: false, fileUnsupported: true }
    }

    return { shared: false, aborted: false }
  }

  async function clipboardCopy(blob: Blob) {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      return { ok: false, reason: '浏览器不支持剪贴板写入' }
    }

    // Strategy 1: Try ClipboardItem with image/png (wider support than jpeg)
    try {
      // Convert to PNG for clipboard (more browser support)
      const pngBlob = await convertToPng(blob)
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ])
      return { ok: true }
    } catch (e) {
      // Strategy 2: Try image/jpeg
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/jpeg': blob }),
        ])
        return { ok: true }
      } catch {
        // Strategy 3: Copy as HTML with embedded image (works in more browsers)
        try {
          const dataUrl = await blobToDataUrl(blob)
          const html = `<img src="${dataUrl}" />`
          const textBlob = new Blob([html], { type: 'text/html' })
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': textBlob,
              'text/plain': new Blob(['鼠鼠嘴替表情包'], { type: 'text/plain' }),
            }),
          ])
          return { ok: true, fallback: true }
        } catch {
          return { ok: false, reason: '复制失败，请长按图片保存' }
        }
      }
    }
  }

  function convertToPng(jpegBlob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((pngBlob) => {
          URL.revokeObjectURL(img.src)
          if (pngBlob) resolve(pngBlob)
          else reject(new Error('PNG conversion failed'))
        }, 'image/png')
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error('Image load failed'))
      }
      img.src = URL.createObjectURL(jpegBlob)
    })
  }

  function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('FileReader failed'))
      reader.readAsDataURL(blob)
    })
  }

  return { hasShareAPI, supportsFileShare, supportsClipboard, shareWithFallback, clipboardCopy }
}
