<template>
  <div class="canvas-wrapper" ref="wrapperRef">
    <canvas
      ref="canvasRef"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    />
    <div class="gesture-hint" v-if="showHint">
      <span>单指拖动文字 · 双指缩放旋转</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import type { MemeProject } from '../types/meme'
import { renderMeme } from '../services/memeRenderer'

const props = defineProps<{
  project: MemeProject
  backgroundImage: HTMLImageElement | null
}>()

const emit = defineEmits<{
  (e: 'update:layer', id: string, changes: Partial<{ x: number; y: number; rotation: number }>): void
}>()

const canvasRef = ref<HTMLCanvasElement>()
const wrapperRef = ref<HTMLDivElement>()

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const layerStart = ref({ x: 0, y: 0 })
const showHint = ref(true)

// Canvas display scale for pinch zoom
const displayScale = ref(1)
const displayOffset = ref({ x: 0, y: 0 })

// Touch state for gestures
const touches = ref<Map<number, { x: number; y: number }>>(new Map())
const initialPinchDistance = ref(0)
const initialPinchScale = ref(1)
const initialPinchRotation = ref(0)
const initialLayerRotation = ref(0)
const isPinching = ref(false)
const isRotating = ref(false)

function render() {
  if (!canvasRef.value || !props.backgroundImage) return
  renderMeme(props.project, canvasRef.value, props.backgroundImage, {
    scale: 1,
    showGuides: true,
  })
  // Apply CSS transform for pinch zoom
  applyDisplayTransform()
}

function applyDisplayTransform() {
  if (!canvasRef.value) return
  const s = displayScale.value
  const { x, y } = displayOffset.value
  canvasRef.value.style.transform = `translate(${x}px, ${y}px) scale(${s})`
}

watch(() => props.project, render, { deep: true })
watch(() => props.backgroundImage, render)

onMounted(() => {
  render()
  // Hide hint after 3 seconds
  setTimeout(() => { showHint.value = false }, 3000)
})

function getCanvasCoords(e: PointerEvent) {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  }
}

function hitTest(cx: number, cy: number): boolean {
  const layer = props.project.textLayers.find((l) => l.id === props.project.activeTextLayerId)
  if (!layer) return false
  return (
    cx >= layer.x && cx <= layer.x + layer.maxWidth &&
    cy >= layer.y && cy <= layer.y + layer.fontSize * 2
  )
}

function onPointerDown(e: PointerEvent) {
  if (isPinching.value) return
  const coords = getCanvasCoords(e)
  if (hitTest(coords.x, coords.y)) {
    isDragging.value = true
    dragStart.value = coords
    layerStart.value = { x: props.project.textLayers[0]?.x ?? 0, y: props.project.textLayers[0]?.y ?? 0 }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value || isPinching.value) return
  const coords = getCanvasCoords(e)
  const layer = props.project.textLayers.find((l) => l.id === props.project.activeTextLayerId)
  if (!layer) return

  let newX = layerStart.value.x + (coords.x - dragStart.value.x)
  let newY = layerStart.value.y + (coords.y - dragStart.value.y)

  const maxX = props.backgroundImage!.naturalWidth - layer.maxWidth
  const maxY = props.backgroundImage!.naturalHeight - layer.fontSize
  newX = Math.max(-layer.maxWidth * 0.8, Math.min(maxX + layer.maxWidth * 0.8, newX))
  newY = Math.max(-layer.fontSize, Math.min(maxY + layer.fontSize, newY))

  emit('update:layer', layer.id, { x: Math.round(newX), y: Math.round(newY) })
}

function onPointerUp() {
  isDragging.value = false
}

// ---- Touch gestures (pinch zoom & rotate) ----
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
    const t1 = e.touches[0]
    const t2 = e.touches[1]
    initialPinchDistance.value = getTouchDistance(t1, t2)
    initialPinchScale.value = displayScale.value
    initialPinchRotation.value = getTouchAngle(t1, t2)
    const layer = props.project.textLayers.find((l) => l.id === props.project.activeTextLayerId)
    initialLayerRotation.value = layer?.rotation ?? 0
    e.preventDefault()
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2 && isPinching.value) {
    const t1 = e.touches[0]
    const t2 = e.touches[1]
    const dist = getTouchDistance(t1, t2)
    const angle = getTouchAngle(t1, t2)

    // Pinch zoom
    if (initialPinchDistance.value > 0) {
      const scale = (dist / initialPinchDistance.value) * initialPinchScale.value
      displayScale.value = Math.max(0.5, Math.min(3, scale))
    }

    // Rotation
    const rotationDelta = angle - initialPinchRotation.value
    const layer = props.project.textLayers.find((l) => l.id === props.project.activeTextLayerId)
    if (layer) {
      emit('update:layer', layer.id, { rotation: Math.round(initialLayerRotation.value + rotationDelta) })
    }

    applyDisplayTransform()
    e.preventDefault()
  }
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length < 2) {
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
  max-height: 60vh;
  display: block;
  transform-origin: center center;
  transition: transform 0.1s ease-out;
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
  animation: fadeOut 0.5s ease 2.5s forwards;
}
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
</style>
