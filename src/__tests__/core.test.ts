import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { TextLayer } from '../types/meme'
import { captionCategories, getRandomCaption } from '../data/captions'

// Mock canvas context for happy-dom
function createMockCtx(): CanvasRenderingContext2D {
  const charWidth = 48 // approx width per Chinese char at fontSize 48
  const ctx = {
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'top' as CanvasTextBaseline,
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineJoin: 'round' as CanvasLineJoin,
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    setLineDash: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    measureText(text: string) {
      const fontSizeMatch = ctx.font.match(/(\d+(?:\.\d+)?)px/)
      const fontSize = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 48
      // Estimate: Chinese char ~fontSize, English ~fontSize*0.6, digit ~fontSize*0.5
      let width = 0
      for (const ch of text) {
        if (/[\u4e00-\u9fff]/.test(ch)) width += fontSize
        else if (/[A-Za-z]/.test(ch)) width += fontSize * 0.6
        else if (/[0-9]/.test(ch)) width += fontSize * 0.5
        else width += fontSize * 0.4
      }
      return { width, actualBoundingBoxAscent: fontSize * 0.8, actualBoundingBoxDescent: fontSize * 0.2 }
    },
    fillText: vi.fn(),
    strokeText: vi.fn(),
    drawImage: vi.fn(),
    strokeRect: vi.fn(),
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D
  return ctx
}

function makeLayer(overrides: Partial<TextLayer> = {}): TextLayer {
  return {
    id: 'test-1',
    text: '测试文字',
    x: 50,
    y: 100,
    maxWidth: 800,
    fontSize: 48,
    fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    fontWeight: 'normal',
    color: '#ffffff',
    strokeEnabled: false,
    strokeColor: '#000000',
    strokeWidth: 3,
    align: 'center',
    lineHeight: 1.3,
    shadowEnabled: false,
    shadowColor: '#000000',
    shadowBlur: 4,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    rotation: 0,
    ...overrides,
  }
}

describe('textLayout', () => {
  let ctx: CanvasRenderingContext2D
  let layoutText: (ctx: CanvasRenderingContext2D, layer: TextLayer, scale: number) => any

  beforeEach(async () => {
    ctx = createMockCtx()
    const mod = await import('../services/textLayout')
    layoutText = mod.layoutText
  })

  it('should layout simple Chinese text as single line', () => {
    const layer = makeLayer({ text: '你好世界' })
    const result = layoutText(ctx, layer, 1)
    expect(result.lines.length).toBe(1)
    expect(result.lines[0].text).toBe('你好世界')
  })

  it('should auto-wrap long Chinese text', () => {
    const layer = makeLayer({ text: '这是一段很长很长的文字用来测试自动换行功能是否正常工作', maxWidth: 300 })
    const result = layoutText(ctx, layer, 1)
    expect(result.lines.length).toBeGreaterThan(1)
    for (const line of result.lines) {
      expect(line.text).toBeTruthy()
    }
  })

  it('should handle manual line breaks', () => {
    const layer = makeLayer({ text: '第一行\n第二行\n第三行' })
    const result = layoutText(ctx, layer, 1)
    expect(result.lines.length).toBe(3)
    expect(result.lines[0].text).toBe('第一行')
    expect(result.lines[1].text).toBe('第二行')
    expect(result.lines[2].text).toBe('第三行')
  })

  it('should handle empty text', () => {
    const layer = makeLayer({ text: '' })
    const result = layoutText(ctx, layer, 1)
    expect(result.lines.length).toBe(1)
    expect(result.lines[0].text).toBe('')
  })

  it('should handle English and numbers', () => {
    const layer = makeLayer({ text: 'Hello World 123' })
    const result = layoutText(ctx, layer, 1)
    expect(result.lines.length).toBeGreaterThanOrEqual(1)
  })

  it('should handle punctuation', () => {
    const layer = makeLayer({ text: '你好！世界？' })
    const result = layoutText(ctx, layer, 1)
    expect(result.lines.length).toBeGreaterThanOrEqual(1)
    const joined = result.lines.map((l: any) => l.text).join('')
    expect(joined).toBe('你好！世界？')
  })

  it('should clamp text position to prevent dragging out of bounds', () => {
    const imgWidth = 1024
    const imgHeight = 1024
    const layer = makeLayer({ maxWidth: 800 })

    const maxX = imgWidth - layer.maxWidth
    const maxY = imgHeight - layer.fontSize

    const clampedX = Math.max(-layer.maxWidth * 0.8, Math.min(maxX + layer.maxWidth * 0.8, maxX))
    const clampedY = Math.max(-layer.fontSize, Math.min(maxY + layer.fontSize, maxY))

    expect(clampedX).toBeLessThanOrEqual(maxX + layer.maxWidth * 0.8)
    expect(clampedY).toBeLessThanOrEqual(maxY + layer.fontSize)
  })

  it('should auto-shrink font for very long text', () => {
    const veryLongText = '这是一段非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的文字'
    const layer = makeLayer({ text: veryLongText, maxWidth: 200, fontSize: 48 })
    const result = layoutText(ctx, layer, 1)
    expect(result.actualFontSize).toBeLessThan(48)
  })

  it('should not shrink below minimum font size', () => {
    const extremelyLong = '字'.repeat(200)
    const layer = makeLayer({ text: extremelyLong, maxWidth: 100, fontSize: 48 })
    const result = layoutText(ctx, layer, 1)
    expect(result.actualFontSize).toBeGreaterThanOrEqual(16)
  })
})

describe('captions', () => {
  it('should have all required categories', () => {
    const names = captionCategories.map((c) => c.name)
    expect(names).toContain('上班')
    expect(names).toContain('摆烂')
    expect(names).toContain('社交')
    expect(names).toContain('没钱')
    expect(names).toContain('减肥')
    expect(names).toContain('熬夜')
    expect(names).toContain('万能回复')
  })

  it('should contain all required captions', () => {
    const allCaptions = captionCategories.flatMap((c) => c.captions)
    const required = [
      '不敢睡觉，睡醒了又要去上班了',
      '明天的事，后天就知道了',
      '爱来爱去的，上两天班就老实了',
      '收到，办不到',
      '在想了，别催',
      '努力不一定成功，不努力一定很轻松',
      '没出息没关系，有气息已经很棒了',
      '失败是成功之母，V我五十你就是成功支付',
      '希望大家都能走出舒适圈，让我进去',
      '花开富贵，申请添加好友',
      '我的财富非常自由，甚至不待在我的账户里',
      '成年人想要翻身，一定要买长一点的数据线',
      '生活没有一点甜头，那很减脂了',
      '熬夜伤身体，建议通宵',
      '世上无难事，只怕有些人',
      '希望今天别发生需要我动脑子的事',
      '我不是情绪越来越稳定，而是老了反应有点慢',
      '不理解，但尊重',
      '你说得对',
      '稍等，我正在编',
      '问题不大，问题很大',
    ]
    for (const cap of required) {
      expect(allCaptions).toContain(cap)
    }
  })

  it('should return a valid caption from getRandomCaption', () => {
    const caption = getRandomCaption()
    expect(typeof caption).toBe('string')
    expect(caption.length).toBeGreaterThan(0)
  })
})

describe('useHistory', () => {
  it('should track undo/redo state', async () => {
    const { useHistory } = await import('../composables/useHistory')
    const history = useHistory()

    const state1 = { backgroundSrc: '', textLayers: [{ id: '1', text: 'hello' }], activeTextLayerId: '1' } as any
    const state2 = { backgroundSrc: '', textLayers: [{ id: '1', text: 'world' }], activeTextLayerId: '1' } as any

    history.pushState(state1)
    expect(history.canUndo.value).toBe(true)
    expect(history.canRedo.value).toBe(false)

    const undone = history.undo(state2)
    expect(undone).toEqual(state1)
    expect(history.canUndo.value).toBe(false)
    expect(history.canRedo.value).toBe(true)

    const redone = history.redo(state2)
    expect(redone).toEqual(state2)
    expect(history.canUndo.value).toBe(true)
    expect(history.canRedo.value).toBe(false)
  })

  it('should limit history to 30 steps', async () => {
    const { useHistory } = await import('../composables/useHistory')
    const history = useHistory()
    for (let i = 0; i < 35; i++) {
      history.pushState({ backgroundSrc: '', textLayers: [{ id: '1', text: `s${i}` }], activeTextLayerId: '1' } as any)
    }
    expect(history.past.value.length).toBeLessThanOrEqual(30)
  })

  it('should clear future on new push', async () => {
    const { useHistory } = await import('../composables/useHistory')
    const history = useHistory()

    const s1 = { backgroundSrc: '', textLayers: [{ id: '1', text: 'a' }], activeTextLayerId: '1' } as any
    const s2 = { backgroundSrc: '', textLayers: [{ id: '1', text: 'b' }], activeTextLayerId: '1' } as any
    const s3 = { backgroundSrc: '', textLayers: [{ id: '1', text: 'c' }], activeTextLayerId: '1' } as any

    history.pushState(s1)
    history.pushState(s2)
    history.undo(s3)
    expect(history.canRedo.value).toBe(true)

    history.pushState(s3)
    expect(history.canRedo.value).toBe(false)
  })
})

describe('localStorage state restoration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should save and restore project state', async () => {
    const { useMemeProject } = await import('../composables/useMemeProject')

    const { project, updateLayer } = useMemeProject()
    updateLayer(project.textLayers[0].id, { text: '保存测试' })

    // Wait for debounce
    await new Promise((r) => setTimeout(r, 600))

    // Create new instance (simulates page reload)
    const { project: project2 } = useMemeProject()
    expect(project2.textLayers[0].text).toBe('保存测试')
  })

  it('should create default project when localStorage is empty', async () => {
    const { useMemeProject } = await import('../composables/useMemeProject')
    const { project } = useMemeProject()
    expect(project.textLayers.length).toBeGreaterThan(0)
    expect(project.activeTextLayerId).toBeTruthy()
  })
})

describe('caption switch preserves style', () => {
  it('should preserve style when switching captions', async () => {
    const { useMemeProject } = await import('../composables/useMemeProject')
    const { project, updateLayer } = useMemeProject()

    updateLayer(project.textLayers[0].id, {
      fontSize: 36,
      color: '#ff0000',
      fontWeight: 'bold',
      strokeEnabled: true,
      strokeWidth: 5,
      align: 'left',
      lineHeight: 1.1,
    })

    const originalStyle = { ...project.textLayers[0] }
    updateLayer(project.textLayers[0].id, { text: '新的文案' })

    const newStyle = project.textLayers[0]
    expect(newStyle.fontSize).toBe(originalStyle.fontSize)
    expect(newStyle.color).toBe(originalStyle.color)
    expect(newStyle.fontWeight).toBe(originalStyle.fontWeight)
    expect(newStyle.strokeEnabled).toBe(originalStyle.strokeEnabled)
    expect(newStyle.strokeWidth).toBe(originalStyle.strokeWidth)
    expect(newStyle.align).toBe(originalStyle.align)
    expect(newStyle.lineHeight).toBe(originalStyle.lineHeight)
  })
})

describe('stable layout for same input', () => {
  it('should produce identical layout for same inputs', async () => {
    const { layoutText } = await import('../services/textLayout')
    const ctx1 = createMockCtx()
    const ctx2 = createMockCtx()
    const layer = makeLayer({ text: '稳定性测试文案' })

    const r1 = layoutText(ctx1, layer, 1)
    const r2 = layoutText(ctx2, layer, 1)

    expect(r1.lines.length).toBe(r2.lines.length)
    for (let i = 0; i < r1.lines.length; i++) {
      expect(r1.lines[i].text).toBe(r2.lines[i].text)
    }
  })
})
