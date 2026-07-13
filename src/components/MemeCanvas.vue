<template>
  <div class="canvas-wrapper" ref="wrapperRef">
    <canvas
      ref="canvasRef"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @click="onCanvasClick"
      @wheel="onWheel"
    />
    <div class="gesture-hint" v-if="showHint">
      <span>点击文字可编辑 · 拖动移动文字 · 滚轮缩放 · Shift+滚轮旋转</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { MemeProject } from '../types/meme'
import { renderMeme } from '../services/memeRenderer'

const props = defineProps<{
  project: MemeProject
  backgroundImage: HTMLImageElement | null
}>()

const emit = defineEmits<{
  (e: 'update:layer', id: string, changes: Partial<{ x: number; y: number; fontSize: number; rotation: number }>): void
  (e: 'edit', layerId: string): void
  (e: 'gestureStart'): void
  (e: 'gestureEnd'): void
}>()

const canvasRef = ref<HTMLCanvasElement>()
const wrapperRef = ref<HTMLDivElement>()

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const layerStart = ref({ x: 0, y: 0 })
const showHint = ref(true)

// Touch gesture state
const initialPinchDistance = ref(0)
const initialFontSize = ref(0)
const initialPinchRotation = ref(0)
const initialLayerRotation = ref(0)
const isPinching = ref(false)
// Throttle resize to avoid jitter
let lastEmittedFontSize = 0
let rafId = 0
// Touch single-finger tap detection
let touchDownPos = { x: 0, y: 0 }
let touchDownTime = 0

function render() {
  if (!canvasRef.value || !props.backgroundImage) return
  renderMeme(props.project, canvasRef.value, props.backgroundImage, {
    scale: 1,
    showGuides: true,
  })
}

watch(() => props.project, render, { deep: true })
watch(() => props.backgroundImage, render)

onMounted(() => {
  render()
  setTimeout(() => { showHint.value = false }, 4000)
})

function getCanvasCoords(clientX: number, clientY: number) {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

function getActiveLayer() {
  return props.project.textLayers.find((l) => l.id === props.project.activeTextLayerId)
}

function hitTest(cx: number, cy: number): boolean {
  const layer = getActiveLayer()
  if (!layer || !canvasRef.value) return false
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return false
  const weight = layer.fontWeight === 'extra-bold' ? '900' : layer.fontWeight
  ctx.font = `${weight} ${layer.fontSize}px ${layer.fontFamily || 'sans-serif'}`
  const textWidth = ctx.measureText(layer.text || ' ').width
  const margin = layer.fontSize * 0.5
  const textX = layer.align === 'center' ? layer.x + (layer.maxWidth - textWidth) / 2
              : layer.align === 'right' ? layer.x + layer.maxWidth - textWidth
              : layer.x
  return (
    cx >= textX - margin && cx <= textX + textWidth + margin &&
    cy >= layer.y - margin && cy <= layer.y + layer.fontSize * 2 + margin
  )
}

// Pointer drag state
let downPos = { x: 0, y: 0 }

function onPointerDown(e: PointerEvent) {
  if (isPinching.value) return
  // Do NOT call e.preventDefault() - it blocks click events on desktop
  const coords = getCanvasCoords(e.clientX, e.clientY)
  downPos = { x: e.clientX, y: e.clientY }

  const layer = getActiveLayer()
  if (hitTest(coords.x, coords.y)) {
    isDragging.value = true
    emit('gestureStart')
    dragStart.value = coords
    // FIX: Use active layer, not textLayers[0]
    layerStart.value = { x: layer?.x ?? 0, y: layer?.y ?? 0 }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value || isPinching.value) return
  const coords = getCanvasCoords(e.clientX, e.clientY)
  const layer = getActiveLayer()
  if (!layer) return

  let newX = layerStart.value.x + (coords.x - dragStart.value.x)
  let newY = layerStart.value.y + (coords.y - dragStart.value.y)

  const maxX = props.backgroundImage!.naturalWidth - layer.maxWidth
  const maxY = props.backgroundImage!.naturalHeight - layer.fontSize
  newX = Math.max(-layer.maxWidth * 0.8, Math.min(maxX + layer.maxWidth * 0.8, newX))
  newY = Math.max(-layer.fontSize, Math.min(maxY + layer.fontSize, newY))

  emit('update:layer', layer.id, { x: Math.round(newX), y: Math.round(newY) })
}

function onPointerUp(e: PointerEvent) {
  if (isDragging.value) emit('gestureEnd')
  isDragging.value = false
}

// Reliable click handler for editing - works on both desktop and mobile
function onCanvasClick(e: MouseEvent) {
  const coords = getCanvasCoords(e.clientX, e.clientY)
  const layer = getActiveLayer()
  if (layer && hitTest(coords.x, coords.y)) {
    emit('edit', layer.id)
  }
}

// ---- Mouse wheel: zoom (Ctrl/Cmd) and rotate (Shift) ----
function onWheel(e: WheelEvent) {
  e.preventDefault()
  const layer = getActiveLayer()
  if (!layer) return

  if (e.shiftKey) {
    // Shift + wheel = rotate
    emit('gestureStart')
    const delta = e.deltaY > 0 ? 5 : -5
    let newRotation = (layer.rotation ?? 0) + delta
    // Clamp to -180..180
    if (newRotation > 180) newRotation -= 360
    if (newRotation < -180) newRotation += 360
    emit('update:layer', layer.id, { rotation: Math.round(newRotation) })
    emit('gestureEnd')
  } else {
    // Wheel = zoom font size
    emit('gestureStart')
    const delta = e.deltaY > 0 ? -2 : 2
    const newFontSize = Math.max(16, Math.min(200, layer.fontSize + delta))
    emit('update:layer', layer.id, { fontSize: newFontSize })
    emit('gestureEnd')
  }
}

// ---- Touch gestures ----
function getTouchDistance(t1: Touch, t2: Touch): number {
  const dx = t2.clientX - t1.clientX
  const dy = t2.clientY - t1.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function getTouchAngle(t1: Touch, t2: Touch): number {
  return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    isPinching.value = true
    isDragging.value = false
    emit('gestureStart')
    const t1 = e.touches[0]
    const t2 = e.touches[1]
    initialPinchDistance.value = getTouchDistance(t1, t2)
    const layer = getActiveLayer()
    initialFontSize.value = layer?.fontSize ?? 72
    initialPinchRotation.value = getTouchAngle(t1, t2)
    initialLayerRotation.value = layer?.rotation ?? 0
    lastEmittedFontSize = initialFontSize.value
  } else if (e.touches.length === 1 && !isPinching.value) {
    const t = e.touches[0]
    touchDownPos = { x: t.clientX, y: t.clientY }
    touchDownTime = Date.now()
    const coords = getCanvasCoords(t.clientX, t.clientY)
    const layer = getActiveLayer()
    if (hitTest(coords.x, coords.y)) {
      isDragging.value = true
      dragStart.value = coords
      // FIX: Use active layer
      layerStart.value = { x: layer?.x ?? 0, y: layer?.y ?? 0 }
    }
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2 && isPinching.value) {
    const t1 = e.touches[0]
    const t2 = e.touches[1]
    const dist = getTouchDistance(t1, t2)
    const angle = getTouchAngle(t1, t2)

    const layer = getActiveLayer()
    if (!layer) return

    if (initialPinchDistance.value > 0) {
      const ratio = dist / initialPinchDistance.value
      const newFontSize = Math.round(Math.max(16, Math.min(200, initialFontSize.value * ratio)))
      if (Math.abs(newFontSize - lastEmittedFontSize) >= 2) {
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          emit('update:layer', layer.id, { fontSize: newFontSize })
          lastEmittedFontSize = newFontSize
        })
      }
    }

    const rotationDelta = angle - initialPinchRotation.value
    emit('update:layer', layer.id, { rotation: Math.round(initialLayerRotation.value + rotationDelta) })
  } else if (e.touches.length === 1 && isDragging.value) {
    const t = e.touches[0]
    const coords = getCanvasCoords(t.clientX, t.clientY)
    const layer = getActiveLayer()
    if (!layer) return

    let newX = layerStart.value.x + (coords.x - dragStart.value.x)
    let newY = layerStart.value.y + (coords.y - dragStart.value.y)

    const maxX = props.backgroundImage!.naturalWidth - layer.maxWidth
    const maxY = props.backgroundImage!.naturalHeight - layer.fontSize
    newX = Math.max(-layer.maxWidth * 0.8, Math.min(maxX + layer.maxWidth * 0.8, newX))
    newY = Math.max(-layer.fontSize, Math.min(maxY + layer.fontSize, newY))

    emit('update:layer', layer.id, { x: Math.round(newX), y: Math.round(newY) })
  }
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length === 0) {
    // On mobile: detect tap via distance (no time check needed)
    if (!isDragging.value && touchDownTime > 0) {
      // Single tap on text -> edit (distance-based, no movement happened)
      const layer = getActiveLayer()
      if (layer) emit('edit', layer.id)
    }
    if (isDragging.value || isPinching.value) emit('gestureEnd')
    isDragging.value = false
    isPinching.value = false
  } else if (e.touches.length < 2) {
    if (isPinching.value) emit('gestureEnd')
    isPinching.value = false
  }
}
</script>

<style scoped>
.canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
  position: relative;
}
canvas {
  width: 100%;
  height: auto;
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  display: block;
  touch-action: none;
}
.gesture-hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 20px;
  pointer-events: none;
  animation: fadeOut 0.5s ease 3.5s forwards;
  white-space: nowrap;
}
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
</style>
