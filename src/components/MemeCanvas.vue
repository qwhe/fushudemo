<template>
  <div class="canvas-wrapper" ref="wrapperRef">
    <canvas
      ref="canvasRef"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    />
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
  (e: 'update:layer', id: string, changes: Partial<{ x: number; y: number }>): void
}>()

const canvasRef = ref<HTMLCanvasElement>()
const wrapperRef = ref<HTMLDivElement>()

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const layerStart = ref({ x: 0, y: 0 })

function render() {
  if (!canvasRef.value || !props.backgroundImage) return
  renderMeme(props.project, canvasRef.value, props.backgroundImage, {
    scale: 1,
    showGuides: true,
  })
}

watch(() => props.project, render, { deep: true })

onMounted(() => {
  render()
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
  // Approximate hit area
  return (
    cx >= layer.x && cx <= layer.x + layer.maxWidth &&
    cy >= layer.y && cy <= layer.y + layer.fontSize * 2
  )
}

function onPointerDown(e: PointerEvent) {
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
  if (!isDragging.value) return
  const coords = getCanvasCoords(e)
  const layer = props.project.textLayers.find((l) => l.id === props.project.activeTextLayerId)
  if (!layer) return

  let newX = layerStart.value.x + (coords.x - dragStart.value.x)
  let newY = layerStart.value.y + (coords.y - dragStart.value.y)

  // Clamp to image bounds
  const maxX = props.backgroundImage!.naturalWidth - layer.maxWidth
  const maxY = props.backgroundImage!.naturalHeight - layer.fontSize
  newX = Math.max(-layer.maxWidth * 0.8, Math.min(maxX + layer.maxWidth * 0.8, newX))
  newY = Math.max(-layer.fontSize, Math.min(maxY + layer.fontSize, newY))

  emit('update:layer', layer.id, { x: Math.round(newX), y: Math.round(newY) })
}

function onPointerUp() {
  isDragging.value = false
}
</script>

<style scoped>
.canvas-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
canvas {
  width: 100%;
  height: auto;
  max-height: 60vh;
  display: block;
}
</style>
