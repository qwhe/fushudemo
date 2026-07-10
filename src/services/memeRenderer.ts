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

    // Apply rotation if needed
    if (layer.rotation !== 0 && layout.lines.length > 0) {
      const firstLine = layout.lines[0]
      const lastLine = layout.lines[layout.lines.length - 1]
      const centerX = firstLine.x + layer.maxWidth * scale / 2
      const centerY = firstLine.y + (lastLine.y - firstLine.y) / 2
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.translate(-centerX, -centerY)
    }

    for (const line of layout.lines) {
      ctx.font = `${layer.fontWeight} ${fontSize}px ${FALLBACK_FONT}`
      ctx.textBaseline = 'top'

      // Shadow
      if (layer.shadowEnabled) {
        ctx.shadowColor = layer.shadowColor
        ctx.shadowBlur = layer.shadowBlur * scale
        ctx.shadowOffsetX = layer.shadowOffsetX * scale
        ctx.shadowOffsetY = layer.shadowOffsetY * scale
      } else {
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      }

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

    // Reset shadow and transform
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    if (layer.rotation !== 0) {
      ctx.restore()
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
