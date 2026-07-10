import type { MemeProject, RenderOptions } from '../types/meme'
import { layoutText } from './textLayout'

const DEFAULT_OPTIONS: RenderOptions = {
  scale: 1,
  showGuides: false,
}

export function renderMeme(
  project: MemeProject,
  canvas: HTMLCanvasElement,
  backgroundImage: HTMLImageElement,
  options: RenderOptions = DEFAULT_OPTIONS,
): void {
  const scale = options.scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = backgroundImage.naturalWidth * scale
  canvas.height = backgroundImage.naturalHeight * scale

  // Draw background
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height)

  // Draw text layers
  const FALLBACK_FONT = '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif'

  for (const layer of project.textLayers) {
    if (!layer.text.trim()) continue

    const layout = layoutText(ctx, layer, scale)
    const fontSize = layout.actualFontSize * scale
    const isActive = layer.id === project.activeTextLayerId

    for (const line of layout.lines) {
      ctx.font = `${layer.fontWeight} ${fontSize}px ${FALLBACK_FONT}`
      ctx.textBaseline = 'top'

      // Stroke
      if (layer.strokeEnabled && layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.strokeColor
        ctx.lineWidth = layer.strokeWidth * scale
        ctx.lineJoin = 'round'
        ctx.strokeText(line.text, line.x, line.y)
      }

      // Fill
      ctx.fillStyle = layer.color
      ctx.fillText(line.text, line.x, line.y)
    }

    // Draw guide border for active layer
    if (options.showGuides && isActive) {
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)'
      ctx.lineWidth = 2
      ctx.strokeRect(
        layer.x * scale - 4,
        layer.y * scale - 4,
        layer.maxWidth * scale + 8,
        layout.totalHeight + 8,
      )
      ctx.setLineDash([])
    }
  }
}
