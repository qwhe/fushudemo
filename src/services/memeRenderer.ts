import type { MemeProject, RenderOptions } from '../types/meme'
import { layoutText } from './textLayout'

const DEFAULT_OPTIONS: RenderOptions = {
  scale: 1,
  showGuides: false,
}

// Regex to split text into emoji and non-emoji segments
const EMOJI_REGEX = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'

function splitTextSegments(text: string): { text: string; isEmoji: boolean }[] {
  const segments: { text: string; isEmoji: boolean }[] = []
  let lastIndex = 0
  for (const match of text.matchAll(EMOJI_REGEX)) {
    if (match.index! > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index!), isEmoji: false })
    }
    segments.push({ text: match[0], isEmoji: true })
    lastIndex = match.index! + match[0].length
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isEmoji: false })
  }
  return segments
}

function drawTextWithEmoji(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  baseFont: string,
  emojiFontSize: number,
): void {
  const segments = splitTextSegments(text)
  let curX = x
  for (const seg of segments) {
    ctx.font = seg.isEmoji ? `${emojiFontSize}px ${EMOJI_FONT}` : baseFont
    if (seg.isEmoji) {
      ctx.fillText(seg.text, curX, y)
    } else {
      ctx.fillText(seg.text, curX, y)
    }
    curX += ctx.measureText(seg.text).width
  }
}

function strokeTextWithEmoji(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  baseFont: string,
  emojiFontSize: number,
): void {
  const segments = splitTextSegments(text)
  let curX = x
  for (const seg of segments) {
    ctx.font = seg.isEmoji ? `${emojiFontSize}px ${EMOJI_FONT}` : baseFont
    // Only stroke non-emoji text (emoji don't need stroke)
    if (!seg.isEmoji) {
      ctx.strokeText(seg.text, curX, y)
      curX += ctx.measureText(seg.text).width
    } else {
      curX += ctx.measureText(seg.text).width
    }
  }
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
      const weight = layer.fontWeight === 'extra-bold' ? '900' : layer.fontWeight
      const baseFont = `${weight} ${fontSize}px ${layer.fontFamily || FALLBACK_FONT}`
      const emojiFontSize = fontSize * 1.1 // Emoji slightly larger for visual match
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

      // Stroke (skip emoji segments)
      if (layer.strokeEnabled && layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.strokeColor
        ctx.lineWidth = layer.strokeWidth * scale
        ctx.lineJoin = 'round'
        strokeTextWithEmoji(ctx, line.text, line.x, line.y, baseFont, emojiFontSize)
      }

      // Fill
      ctx.fillStyle = layer.color
      drawTextWithEmoji(ctx, line.text, line.x, line.y, baseFont, emojiFontSize)
    }

    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Draw guide border for active layer (tight to text, inside rotation transform)
    if (options.showGuides && isActive && layout.lines.length > 0) {
      const firstLine = layout.lines[0]
      const lastLine = layout.lines[layout.lines.length - 1]
      const minX = Math.min(...layout.lines.map(l => l.x)) - 4
      const maxX = Math.max(...layout.lines.map(l => l.x + l.width)) + 4
      const minY = firstLine.y - 4
      const maxY = lastLine.y + fontSize + 4
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)'
      ctx.lineWidth = 2
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
      ctx.setLineDash([])
    }

    // Restore rotation transform
    if (layer.rotation !== 0) {
      ctx.restore()
    }
  }
}
