import type { TextLayer } from '../types/meme'

export interface LineMetrics {
  text: string
  width: number
  x: number
  y: number
}

export interface TextLayoutResult {
  lines: LineMetrics[]
  totalHeight: number
  actualFontSize: number
}

const FALLBACK_FONT = '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif'

function measureLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontWeight: string,
): number {
  ctx.font = `${fontWeight} ${fontSize}px ${FALLBACK_FONT}`
  return ctx.measureText(text).width
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  fontWeight: string,
): string[] {
  const paragraphs = text.split('\n')
  const allLines: string[] = []

  for (const para of paragraphs) {
    if (para === '') {
      allLines.push('')
      continue
    }
    let current = ''
    for (const char of para) {
      const test = current + char
      if (measureLine(ctx, test, fontSize, fontWeight) > maxWidth && current !== '') {
        allLines.push(current)
        current = char
      } else {
        current = test
      }
    }
    if (current) allLines.push(current)
  }

  return allLines
}

export function layoutText(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  scale: number,
): TextLayoutResult {
  let fontSize = layer.fontSize
  const fontWeight = layer.fontWeight
  const maxWidth = layer.maxWidth * scale

  // Long text: auto-shrink font
  const MIN_FONT_SIZE = 16
  let lines = wrapLines(ctx, layer.text, maxWidth, fontSize * scale, fontWeight)
  while (lines.length > 8 && fontSize > MIN_FONT_SIZE) {
    fontSize -= 2
    lines = wrapLines(ctx, layer.text, maxWidth, fontSize * scale, fontWeight)
  }

  const scaledFontSize = fontSize * scale
  const scaledLineHeight = scaledFontSize * layer.lineHeight
  const totalHeight = lines.length * scaledLineHeight

  const lineMetrics: LineMetrics[] = []
  for (let i = 0; i < lines.length; i++) {
    const lineW = measureLine(ctx, lines[i], scaledFontSize, fontWeight)
    let x: number
    if (layer.align === 'center') {
      x = layer.x * scale + (maxWidth - lineW) / 2
    } else if (layer.align === 'right') {
      x = layer.x * scale + maxWidth - lineW
    } else {
      x = layer.x * scale
    }
    lineMetrics.push({
      text: lines[i],
      width: lineW,
      x,
      y: layer.y * scale + i * scaledLineHeight,
    })
  }

  return { lines: lineMetrics, totalHeight, actualFontSize: fontSize }
}
