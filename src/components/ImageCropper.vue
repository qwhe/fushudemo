<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="crop-overlay">
        <div class="crop-panel">
          <div class="crop-header">
            <h3>裁切图片</h3>
            <button class="close-btn" @click="cancel">✕</button>
          </div>
          <div class="crop-area" ref="areaRef">
            <canvas ref="canvasRef"
              @mousedown="onMouseDown"
              @mousemove="onMouseMove"
              @mouseup="onMouseUp"
              @mouseleave="onMouseUp"
              @touchstart.prevent="onTouchStart"
              @touchmove.prevent="onTouchMove"
              @touchend="onTouchEnd"
            />
          </div>
          <div class="crop-hint">拖动调整位置 · 双指缩放/旋转照片</div>
          <div class="crop-actions">
            <button class="crop-btn" @click="cancel">取消</button>
            <button class="crop-btn primary" @click="confirm">确认裁切</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const visible = ref(false)
const canvasRef = ref<HTMLCanvasElement>()
const areaRef = ref<HTMLDivElement>()
const img = ref<HTMLImageElement | null>(null)

// Photo transform (photo moves, crop box stays fixed)
const photoX = ref(0)
const photoY = ref(0)
const photoScale = ref(1)
const photoRotation = ref(0)

// Crop output size (always square)
const CROP_SIZE = 1200

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragPhotoStart = ref({ x: 0, y: 0 })

// Pinch + rotate
const initialPinchDist = ref(0)
const initialScale = ref(1)
const initialRotation = ref(0)
const initialAngle = ref(0)
const isPinching = ref(false)

const emit = defineEmits<{
  (e: 'cropped', dataUrl: string): void
}>()

function open(src: string) {
  visible.value = true
  const image = new Image()
  image.onload = () => {
    img.value = image
    nextTick(initView)
  }
  image.src = src
}

function initView() {
  if (!img.value || !canvasRef.value || !areaRef.value) return
  const area = areaRef.value.getBoundingClientRect()
  const displaySize = Math.min(area.width - 16, area.height - 16)

  // Canvas renders at crop output resolution for sharp preview
  canvasRef.value.width = CROP_SIZE
  canvasRef.value.height = CROP_SIZE

  // Fit image into crop area
  const iw = img.value.naturalWidth
  const ih = img.value.naturalHeight
  // Scale so the smaller side fills the crop area
  photoScale.value = CROP_SIZE / Math.min(iw, ih)
  // Center the image
  photoX.value = (CROP_SIZE - iw * photoScale.value) / 2
  photoY.value = (CROP_SIZE - ih * photoScale.value) / 2

  render()
}

function render() {
  const canvas = canvasRef.value
  const image = img.value
  if (!canvas || !image) return
  const ctx = canvas.getContext('2d')!
  const s = CROP_SIZE

  // Black background
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, s, s)

  // Draw photo with rotation
  ctx.save()
  const photoW = image.naturalWidth * photoScale.value
  const photoH = image.naturalHeight * photoScale.value
  const centerX = photoX.value + photoW / 2
  const centerY = photoY.value + photoH / 2
  ctx.translate(centerX, centerY)
  ctx.rotate(photoRotation.value * Math.PI / 180)
  ctx.translate(-centerX, -centerY)
  ctx.drawImage(image, photoX.value, photoY.value, photoW, photoH)
  ctx.restore()

  // Crop border (fixed, always centered)
  // Actually the entire canvas IS the crop area, so no border needed
  // But add subtle corner markers
  const m = 30
  const cornerLen = 40
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  // Top-left
  ctx.beginPath(); ctx.moveTo(m, m + cornerLen); ctx.lineTo(m, m); ctx.lineTo(m + cornerLen, m); ctx.stroke()
  // Top-right
  ctx.beginPath(); ctx.moveTo(s - m - cornerLen, m); ctx.lineTo(s - m, m); ctx.lineTo(s - m, m + cornerLen); ctx.stroke()
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(m, s - m - cornerLen); ctx.lineTo(m, s - m); ctx.lineTo(m + cornerLen, s - m); ctx.stroke()
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(s - m - cornerLen, s - m); ctx.lineTo(s - m, s - m); ctx.lineTo(s - m, s - m - cornerLen); ctx.stroke()
}

function getLocalCoords(clientX: number, clientY: number) {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  const ratio = CROP_SIZE / rect.width
  return {
    x: (clientX - rect.left) * ratio,
    y: (clientY - rect.top) * ratio,
  }
}

// ---- Mouse ----
function onMouseDown(e: MouseEvent) {
  if (isPinching.value) return
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  dragPhotoStart.value = { x: photoX.value, y: photoY.value }
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value || isPinching.value) return
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const ratio = CROP_SIZE / rect.width
  photoX.value = dragPhotoStart.value.x + (e.clientX - dragStart.value.x) * ratio
  photoY.value = dragPhotoStart.value.y + (e.clientY - dragStart.value.y) * ratio
  render()
}

function onMouseUp() {
  isDragging.value = false
}

// ---- Touch ----
function touchDist(t1: Touch, t2: Touch) {
  const dx = t2.clientX - t1.clientX
  const dy = t2.clientY - t1.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function getAngle(t1: Touch, t2: Touch) {
  return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    isPinching.value = true
    isDragging.value = false
    initialPinchDist.value = touchDist(e.touches[0], e.touches[1])
    initialScale.value = photoScale.value
    initialRotation.value = photoRotation.value
    initialAngle.value = getAngle(e.touches[0], e.touches[1])
    dragStart.value = {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
    }
    dragPhotoStart.value = { x: photoX.value, y: photoY.value }
  } else if (e.touches.length === 1 && !isPinching.value) {
    isDragging.value = true
    dragStart.value = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    dragPhotoStart.value = { x: photoX.value, y: photoY.value }
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2 && isPinching.value) {
    const dist = touchDist(e.touches[0], e.touches[1])
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2

    if (!canvasRef.value) return
    const rect = canvasRef.value.getBoundingClientRect()
    const ratio = CROP_SIZE / rect.width

    if (initialPinchDist.value > 0) {
      // Scale
      const newScale = initialScale.value * (dist / initialPinchDist.value)
      const iw = img.value!.naturalWidth
      const ih = img.value!.naturalHeight
      // Scale around center of crop area
      const centerX = CROP_SIZE / 2
      const centerY = CROP_SIZE / 2
      const oldCenterPhotoX = (centerX - dragPhotoStart.value.x) / initialScale.value
      const oldCenterPhotoY = (centerY - dragPhotoStart.value.y) / initialScale.value
      photoScale.value = newScale
      photoX.value = centerX - oldCenterPhotoX * newScale + (midX - dragStart.value.x) * ratio
      photoY.value = centerY - oldCenterPhotoY * newScale + (midY - dragStart.value.y) * ratio
      // Rotation
      const newAngle = getAngle(e.touches[0], e.touches[1])
      photoRotation.value = initialRotation.value + (newAngle - initialAngle.value)
    }
    render()
  } else if (e.touches.length === 1 && isDragging.value) {
    if (!canvasRef.value) return
    const rect = canvasRef.value.getBoundingClientRect()
    const ratio = CROP_SIZE / rect.width
    photoX.value = dragPhotoStart.value.x + (e.touches[0].clientX - dragStart.value.x) * ratio
    photoY.value = dragPhotoStart.value.y + (e.touches[0].clientY - dragStart.value.y) * ratio
    render()
  }
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length === 0) {
    isDragging.value = false
    isPinching.value = false
  } else if (e.touches.length < 2) {
    isPinching.value = false
    if (e.touches.length === 1) {
      isDragging.value = true
      dragStart.value = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      dragPhotoStart.value = { x: photoX.value, y: photoY.value }
    }
  }
}

function confirm() {
  if (!canvasRef.value) return
  // Canvas already has the cropped content at full resolution
  let quality = 0.85
  let dataUrl = canvasRef.value.toDataURL('image/jpeg', quality)
  while (dataUrl.length > 300 * 1024 * 1.37 && quality > 0.2) {
    quality -= 0.05
    dataUrl = canvasRef.value.toDataURL('image/jpeg', quality)
  }
  visible.value = false
  emit('cropped', dataUrl)
}

function cancel() {
  visible.value = false
}

defineExpose({ open })
</script>

<style scoped>
.crop-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}
.crop-panel {
  width: 94%;
  max-width: 520px;
  max-height: 92vh;
  background: #1a1e2e;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.crop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.crop-header h3 {
  color: #f0f0f0;
  font-size: 17px;
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
}
.crop-area {
  width: 100%;
  aspect-ratio: 1;
  max-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
}
.crop-area canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
  cursor: grab;
}
.crop-area canvas:active {
  cursor: grabbing;
}
.crop-hint {
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  text-align: center;
}
.crop-actions {
  display: flex;
  gap: 10px;
}
.crop-btn {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: #ddd;
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
}
.crop-btn.primary {
  background: #4da6ff;
  border-color: #4da6ff;
  color: #fff;
}
.crop-btn:active { transform: scale(0.96); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
