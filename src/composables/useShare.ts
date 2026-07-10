import { ref, onMounted } from 'vue'

export function useShare() {
  const hasShareAPI = ref(false)
  const supportsFileShare = ref(false)
  const supportsClipboard = ref(false)

  onMounted(() => {
    hasShareAPI.value = !!navigator.share
    supportsFileShare.value = hasShareAPI.value && typeof navigator.canShare === 'function'
    supportsClipboard.value = !!(navigator.clipboard && navigator.clipboard.write)
  })

  async function shareFile(blob: Blob, title: string = '负鼠表情包') {
    const file = new File([blob], 'opossum-meme.png', { type: 'image/png' })
    const shareData: ShareData = { title, files: [file] }
    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData)
      return true
    }
    return false
  }

  async function shareWithFallback(blob: Blob, title: string = '负鼠表情包') {
    const file = new File([blob], 'opossum-meme.png', { type: 'image/png' })
    const shareData: ShareData = { title, files: [file] }
    if (navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        return { shared: true }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return { shared: false, aborted: true }
        return { shared: false, aborted: false }
      }
    }
    return { shared: false, aborted: false }
  }

  async function clipboardCopy(blob: Blob) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      return true
    } catch {
      return false
    }
  }

  return { hasShareAPI, supportsFileShare, supportsClipboard, shareFile, shareWithFallback, clipboardCopy }
}
