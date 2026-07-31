<template>
  <div
    class="app"
    :class="{ 'is-dragging-image': isDraggingImage }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Mobile Layout -->
    <div class="mobile-layout">
      <header class="mobile-header">
        <h1 class="app-title">负鼠表情</h1>
        <div class="header-actions">
          <button class="icon-btn" @click="triggerUpload" title="换背景图">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </button>
          <button class="icon-btn" :disabled="!history.canUndo.value" @click="onUndo" title="撤销">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h13a4 4 0 010 8H9"/><path d="M7 6l-4 4 4 4"/></svg>
          </button>
          <button class="icon-btn" :disabled="!history.canRedo.value" @click="onRedo" title="重做">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10H8a4 4 0 000 8h7"/><path d="M17 6l4 4-4 4"/></svg>
          </button>
          <button class="icon-btn" @click="confirmRestart" title="重新开始">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          </button>
        </div>
        <input type="file" ref="fileInputRef" accept="image/*" @change="onFileSelected" style="display:none" />
      </header>

      <div class="canvas-area" ref="canvasAreaRef">
        <MemeCanvas
          :project="project"
          :background-image="bgImage"
          @update:layer="onDragLayer"
          @edit="onStartEdit"
          @gesture-start="onGestureStart"
          @gesture-end="onGestureEnd"
        />
        <!-- Inline text editor overlay -->
        <div v-if="editing" class="inline-editor" :style="editorStyle">
          <textarea
            ref="inlineTextareaRef"
            v-model="editText"
            class="inline-textarea"
            rows="1"
            maxlength="150"
            @keydown.enter.exact="finishEdit"
            @blur="finishEdit"
            placeholder="输入表情包文案..."
          />
          <div class="inline-hint">Enter 确认 · 点击外部关闭</div>
        </div>
      </div>

      <div class="editor-area">
        <WordCloud @select="onCaptionSelect" />

        <div class="toolbar-toggle" @click="showToolbar = !showToolbar">
          <span>{{ showToolbar ? '收起样式' : '文字样式' }}</span>
          <svg :class="{ rotated: showToolbar }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>

        <StyleToolbar
          v-if="showToolbar && activeLayer"
          :layer="activeLayer"
          @update:layer="onStyleUpdate"
          @reset="onReset"
        />
      </div>

      <div class="bottom-actions">
        <button class="btn-primary" @click="onExport" :disabled="exp.exporting.value">
          {{ exp.exporting.value ? '生成中...' : '生成表情' }}
        </button>
      </div>
    </div>

    <!-- Desktop Layout -->
    <div class="desktop-layout">
      <nav class="tool-rail" aria-label="编辑工具">
        <div class="brand-tile" title="负鼠表情">
          <img :src="logoSrc" alt="负鼠表情 Logo" />
        </div>

        <div class="mini-program-entry">
          <div class="mini-program-popover">
            <div class="mini-program-head">
              <span>微信扫码打开</span>
              <span class="mini-program-badge">小程序</span>
            </div>
            <img :src="miniProgramCodeSrc" alt="负鼠表情微信小程序码" />
            <p>手机微信扫一扫，随时制作表情</p>
          </div>
          <button
            class="rail-button mini-program-button"
            type="button"
            aria-label="打开微信小程序码"
          >
            <IconQrcode :size="21" stroke-width="1.7" />
            <span>小程序</span>
          </button>
        </div>
      </nav>

      <aside class="desktop-sidebar">
        <header class="desktop-heading">
          <p>OPOSSUM STUDIO</p>
          <h1 class="app-title desktop-title">负鼠表情</h1>
          <span>把情绪，做成一张图</span>
        </header>

        <section id="background-section" class="desktop-section">
          <h3 class="section-title">背景</h3>
          <button
            class="upload-dropzone"
            :class="{ 'is-dragging': isDraggingImage }"
            type="button"
            @click="triggerUpload"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            <span class="upload-title">换背景图</span>
            <span class="upload-hint">点击、拖拽或粘贴图片</span>
          </button>
          <input type="file" ref="fileInputRef2" accept="image/*" @change="onFileSelected" style="display:none" />
        </section>

        <section id="caption-section" class="desktop-section">
          <h3 class="section-title">文案</h3>
          <WordCloud @select="onCaptionSelect" />
        </section>

        <section id="style-section" class="desktop-section">
          <h3 class="section-title">文字样式</h3>
          <StyleToolbar
            v-if="activeLayer"
            :layer="activeLayer"
            @update:layer="onStyleUpdate"
            @reset="onReset"
          />
        </section>

      </aside>

      <main class="desktop-stage">
        <div class="stage-label">
          <span>画布预览</span>
          <span>点击文字编辑 · 拖动调整位置 · 滚轮缩放</span>
        </div>
        <div class="desktop-canvas-area" ref="canvasAreaRef2">
          <MemeCanvas
            :project="project"
            :background-image="bgImage"
            @update:layer="onDragLayer"
            @edit="onStartEdit"
            @gesture-start="onGestureStart"
            @gesture-end="onGestureEnd"
          />
          <div v-if="editing" class="inline-editor" :style="editorStyle">
            <textarea
              ref="inlineTextareaRef"
              v-model="editText"
              class="inline-textarea"
              rows="1"
              maxlength="150"
              @keydown.enter.exact="finishEdit"
              @blur="finishEdit"
              placeholder="输入表情包文案..."
            />
            <div class="inline-hint">Enter 确认 · 点击外部关闭</div>
          </div>
        </div>

        <div class="stage-actions">
          <div class="desktop-history">
            <button class="stage-icon-button" :disabled="!history.canUndo.value" @click="onUndo" title="撤销">
              <IconArrowBackUp :size="19" stroke-width="1.7" />
            </button>
            <button class="stage-icon-button" :disabled="!history.canRedo.value" @click="onRedo" title="重做">
              <IconArrowForwardUp :size="19" stroke-width="1.7" />
            </button>
            <button class="stage-text-button" @click="confirmRestart">
              <IconRefresh :size="17" stroke-width="1.7" />
              重新开始
            </button>
          </div>
          <button class="generate-button" @click="onExport" :disabled="exp.exporting.value">
            <IconSparkles :size="19" stroke-width="1.8" />
            {{ exp.exporting.value ? '正在生成...' : '生成表情' }}
          </button>
        </div>
      </main>
    </div>

    <ImageCropper ref="cropperRef" @cropped="onCropped" />

    <Toast ref="toastRef" />

    <!-- Reset Confirmation Dialog -->
    <div v-if="showResetConfirm" class="confirm-overlay" @click.self="cancelReset">
      <div class="confirm-dialog">
        <p class="confirm-message">确定要重新开始吗？当前编辑内容将不会被保存。</p>
        <div class="confirm-actions">
          <button class="btn-secondary" @click="cancelReset">取消</button>
          <button class="btn-primary btn-danger" @click="doReset">确定</button>
        </div>
      </div>
    </div>

    <ExportPreview
      :blob-url="exportBlobUrl"
      :exporting="exp.exporting.value"
      @download="onDownload"
      @share="onShare"
      @copy="onCopy"
      @close="exportBlobUrl = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, triggerRef } from 'vue'
import type { TextLayer, MemeProject } from './types/meme'
import { findImageFile } from './utils/imageInput'
import { useMemeProject } from './composables/useMemeProject'
import { useHistory } from './composables/useHistory'
import { useExport } from './composables/useExport'
import { useShare } from './composables/useShare'
import MemeCanvas from './components/MemeCanvas.vue'
import StyleToolbar from './components/StyleToolbar.vue'
import WordCloud from './components/WordCloud.vue'
import ExportPreview from './components/ExportPreview.vue'
import ImageCropper from './components/ImageCropper.vue'
import Toast from './components/Toast.vue'
import baseImageSrc from './assets/opossum-base.jpg'
import logoSrc from './assets/opossum-logo.png'
import miniProgramCodeSrc from './assets/miniprogram-code.png'
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconQrcode,
  IconRefresh,
  IconSparkles,
} from '@tabler/icons-vue'

const {
  project,
  activeTextLayer: activeLayer,
  updateLayer,
  resetStyle,
  restart,
} = useMemeProject()

const history = useHistory()
const exp = useExport()
const share = useShare()

const bgImage = ref<HTMLImageElement | null>(null)
const showToolbar = ref(false)
const exportBlobUrl = ref<string | null>(null)
let exportBlob: Blob | null = null

const fileInputRef = ref<HTMLInputElement>()
const fileInputRef2 = ref<HTMLInputElement>()
const cropperRef = ref<InstanceType<typeof ImageCropper>>()
const toastRef = ref<InstanceType<typeof Toast>>()
const canvasAreaRef = ref<HTMLDivElement>()
const canvasAreaRef2 = ref<HTMLDivElement>()
const inlineTextareaRef = ref<HTMLTextAreaElement>()

const editing = ref(false)
const editText = ref('')
const isDraggingImage = ref(false)
let dragDepth = 0

function loadBgImage(src: string) {
  const img = new Image()
  img.onload = () => {
    bgImage.value = img
    const layer = project.textLayers[0]
    layer.maxWidth = img.naturalWidth * 0.85
    layer.x = img.naturalWidth * 0.075
    layer.y = img.naturalHeight * 0.65
  }
  img.src = src
}

onMounted(() => {
  loadBgImage(baseImageSrc)
  window.addEventListener('paste', onPaste)
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste)
})

function triggerUpload() {
  const input = window.innerWidth >= 768 ? fileInputRef2.value : fileInputRef.value
  input?.click()
}

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = ''
  openImageFile(file)
}

function openImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    toastRef.value?.show('请选择图片文件', 'error')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    cropperRef.value?.open(reader.result as string)
  }
  reader.onerror = () => {
    toastRef.value?.show('图片读取失败，请重试', 'error')
  }
  reader.readAsDataURL(file)
}

function onDragEnter() {
  dragDepth += 1
  isDraggingImage.value = true
}

function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDraggingImage.value = false
}

function onDrop(e: DragEvent) {
  dragDepth = 0
  isDraggingImage.value = false
  const file = findImageFile(e.dataTransfer?.files)
  if (file) {
    openImageFile(file)
  } else {
    toastRef.value?.show('请拖入图片文件', 'error')
  }
}

function onPaste(e: ClipboardEvent) {
  const file = findImageFile(e.clipboardData?.files)
  if (!file) return
  e.preventDefault()
  openImageFile(file)
}

function onCropped(dataUrl: string) {
  flushHistory()
  history.pushState(JSON.parse(JSON.stringify(project)))
  project.backgroundSrc = dataUrl
  loadBgImage(dataUrl)
}

let lastPushTime = 0
let pendingSnapshot: MemeProject | null = null
const MERGE_INTERVAL = 1500

function pushHistory() {
  const now = Date.now()
  if (now - lastPushTime < MERGE_INTERVAL && pendingSnapshot) {
    lastPushTime = now
  } else {
    if (pendingSnapshot) {
      history.pushState(pendingSnapshot)
    }
    pendingSnapshot = JSON.parse(JSON.stringify(project)) as MemeProject
    lastPushTime = now
  }
}

function flushHistory() {
  if (pendingSnapshot) {
    history.pushState(pendingSnapshot)
    pendingSnapshot = null
  }
}

function onTextChange(text: string) {
  pushHistory()
  updateLayer(activeLayer.value!.id, { text })
}

const editorStyle = computed(() => {
  if (!bgImage.value || !activeLayer.value) return {}
  const layer = activeLayer.value
  const isDesktop = window.innerWidth >= 768
  const area = isDesktop ? canvasAreaRef2.value : canvasAreaRef.value
  if (!area) return {}
  const canvasEl = area.querySelector('canvas')
  if (!canvasEl) return {}

  const areaRect = area.getBoundingClientRect()
  const canvasRect = canvasEl.getBoundingClientRect()
  const offsetX = canvasRect.left - areaRect.left
  const offsetY = canvasRect.top - areaRect.top

  const scaleX = canvasRect.width / bgImage.value.naturalWidth
  const scaleY = canvasRect.height / bgImage.value.naturalHeight

  const left = offsetX + layer.x * scaleX
  const top = offsetY + layer.y * scaleY - 44

  const maxLeft = areaRect.width - 16
  const maxTop = areaRect.height - 80

  return {
    left: Math.max(8, Math.min(left, maxLeft)) + 'px',
    top: Math.max(8, Math.min(top, maxTop)) + 'px',
    width: Math.min(maxLeft - 8, layer.maxWidth * scaleX) + 'px',
  }
})

function onStartEdit() {
  const layer = activeLayer.value
  if (!layer) return
  editing.value = true
  editText.value = layer.text
  nextTick(() => {
    inlineTextareaRef.value?.focus()
    const el = inlineTextareaRef.value
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  })
}

function finishEdit() {
  if (!editing.value) return
  const layer = activeLayer.value
  if (layer && editText.value !== layer.text) {
    flushHistory()
    history.pushState(JSON.parse(JSON.stringify(project)))
    updateLayer(layer.id, { text: editText.value })
  }
  editing.value = false
}

function onStyleUpdate(id: string, changes: Partial<TextLayer>) {
  pushHistory()
  updateLayer(id, changes)
}

function onGestureStart() {
  flushHistory()
  history.pushState(JSON.parse(JSON.stringify(project)))
}

function onGestureEnd() {}

function onDragLayer(id: string, changes: Partial<{ x: number; y: number; fontSize: number; rotation: number }>) {
  updateLayer(id, changes)
}

function onReset() {
  flushHistory()
  history.pushState(JSON.parse(JSON.stringify(project)))
  resetStyle()
}

function applyState(state: MemeProject) {
  project.backgroundSrc = state.backgroundSrc
  project.activeTextLayerId = state.activeTextLayerId
  while (project.textLayers.length > 0) {
    project.textLayers.pop()
  }
  for (const layer of state.textLayers) {
    project.textLayers.push(layer)
  }
}

function onUndo() {
  flushHistory()
  if (!history.canUndo.value) return
  const current = JSON.parse(JSON.stringify(project)) as MemeProject
  const prev = history.undo(current)
  if (prev) {
    applyState(prev)
    toastRef.value?.show('已撤销', 'info')
  }
}

function onRedo() {
  flushHistory()
  if (!history.canRedo.value) {
    toastRef.value?.show('没有可重做的操作', 'error')
    return
  }
  const current = JSON.parse(JSON.stringify(project)) as MemeProject
  const next = history.redo(current)
  if (next) {
    applyState(next)
    toastRef.value?.show('已重做', 'success')
  } else {
    toastRef.value?.show('重做失败', 'error')
  }
}

const showResetConfirm = ref(false)
function confirmRestart() {
  showResetConfirm.value = true
}
function doReset() {
  showResetConfirm.value = false
  history.pushState(JSON.parse(JSON.stringify(project)))
  project.backgroundSrc = ''
  loadBgImage(baseImageSrc)
  restart()
  const layer = project.textLayers[0]
  if (layer && bgImage.value) {
    layer.x = bgImage.value.naturalWidth * 0.075
    layer.y = bgImage.value.naturalHeight * 0.65
    layer.maxWidth = bgImage.value.naturalWidth * 0.85
  }
  history.clearHistory()
}
function cancelReset() {
  showResetConfirm.value = false
}

function onCaptionSelect(caption: string) {
  flushHistory()
  history.pushState(JSON.parse(JSON.stringify(project)))
  updateLayer(activeLayer.value!.id, {
    text: caption,
    fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    fontWeight: 'extra-bold',
  })
}

async function onExport() {
  if (!bgImage.value) return
  try {
    exportBlob = await exp.generateExport(JSON.parse(JSON.stringify(project)), bgImage.value)
    const reader = new FileReader()
    reader.onload = () => {
      exportBlobUrl.value = reader.result as string
    }
    reader.readAsDataURL(exportBlob)
  } catch {}
}

function onDownload() {
  if (!exportBlob) return
  const ts = Math.floor(Date.now() / 1000)
  exp.downloadBlob(exportBlob, `opossum-meme-${ts}.jpg`)
  toastRef.value?.show('图片已开始下载', 'success')
}

async function onShare() {
  if (!exportBlob) return
  const isWeChat = /micromessenger/i.test(navigator.userAgent)
  if (isWeChat) {
    toastRef.value?.show('请长按图片 → 选择「转发给朋友」', 'info', 3000)
    return
  }
  const result = await share.shareWithFallback(exportBlob)
  if (result.aborted) return
  if (result.shared) {
    toastRef.value?.show('分享成功', 'success')
  } else {
    const url = URL.createObjectURL(exportBlob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 30000)
    toastRef.value?.show('已在新页面打开图片，可长按保存或转发', 'info')
  }
}

async function onCopy() {
  if (!exportBlob) return
  const result = await share.clipboardCopy(exportBlob)
  if (result.ok) {
    toastRef.value?.show(
      result.fallback ? '已复制图片（粘贴时可能显示为链接）' : '已复制到剪贴板',
      'success'
    )
  } else {
    toastRef.value?.show(result.reason || '复制失败，当前浏览器不支持图片复制', 'error')
  }
}
</script>

<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  overflow: hidden;
}

body {
  background: #101115;
  color: #e8e8e8;
  font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}

#app {
  height: 100%;
}
</style>

<style scoped>
.app {
  height: 100%;
  overflow: hidden;
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 250;
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirm-dialog {
  width: 80%;
  max-width: 320px;
  background: #1a1e2e;
  border-radius: 14px;
  padding: 24px 20px 16px;
  text-align: center;
}
.confirm-message {
  color: #ddd;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 20px;
}
.confirm-actions {
  display: flex;
  gap: 12px;
}
.confirm-actions .btn-secondary {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: #ccc;
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
}
.confirm-actions .btn-danger {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}

.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 100vw;
}

.desktop-layout {
  display: none;
}

.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: #f0f0f0;
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: #bbb;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.icon-btn:not(:disabled):active {
  transform: scale(0.92);
}

.icon-btn.danger:not(:disabled) {
  color: #ff6b6b;
}

.canvas-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  min-height: 0;
  position: relative;
}

.inline-editor {
  position: absolute;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: auto;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.inline-textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid #4da6ff;
  border-radius: 10px;
  color: #f0f0f0;
  font-size: 15px;
  padding: 10px 12px;
  resize: none;
  outline: none;
  font-family: inherit;
  line-height: 1.5;
  min-height: 40px;
  max-height: 120px;
  overflow-y: auto;
}
.inline-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}
.inline-hint {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  text-align: center;
}

.editor-area {
  flex-shrink: 0;
  padding: 0 16px 8px;
  overflow-y: auto;
  max-height: 45vh;
}

.toolbar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  cursor: pointer;
}

.toolbar-toggle svg {
  transition: transform 0.2s;
}

.toolbar-toggle svg.rotated {
  transform: rotate(180deg);
}

.bottom-actions {
  display: flex;
  gap: 10px;
  padding: 10px 16px;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.btn-primary {
  flex: 1;
  padding: 12px 20px;
  border-radius: 10px;
  border: none;
  background: #4da6ff;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  min-height: 48px;
  transition: opacity 0.2s;
}

.btn-primary:disabled {
  opacity: 0.5;
}

.btn-primary:not(:disabled):active {
  transform: scale(0.97);
}

.btn-secondary {
  width: 100%;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: #ddd;
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.2s;
}

.btn-secondary:active {
  transform: scale(0.96);
}

/* ---- Desktop Layout ---- */
@media (min-width: 768px) {
  .mobile-layout {
    display: none;
  }

  .desktop-layout {
    display: grid;
    grid-template-columns: 76px 356px minmax(0, 1fr);
    width: min(1400px, calc(100% - 48px));
    height: calc(100% - 32px);
    margin: 16px auto;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.055);
    border-radius: 22px;
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.32);
    background:
      radial-gradient(circle at 72% 34%, rgba(255, 255, 255, 0.025), transparent 33%),
      #111216;
  }

  .tool-rail {
    position: relative;
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 10px 14px;
    background: #0b0c0f;
    border-right: 1px solid rgba(255, 255, 255, 0.065);
  }

  .brand-tile {
    width: 48px;
    height: 48px;
    padding: 4px;
    overflow: hidden;
    border-radius: 13px;
    background: #f1eee8;
    box-shadow: 0 8px 26px rgba(0, 0, 0, 0.32);
  }

  .brand-tile img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    border-radius: 9px;
  }

  .rail-button {
    width: 56px;
    min-height: 58px;
    margin: 0 auto;
    padding: 8px 4px 7px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: 1px solid transparent;
    border-radius: 12px;
    background: transparent;
    color: rgba(226, 229, 235, 0.46);
    font: inherit;
    font-size: 10px;
    cursor: pointer;
    transition: 160ms ease;
  }

  .rail-button:hover {
    color: rgba(255, 255, 255, 0.78);
    background: rgba(255, 255, 255, 0.045);
  }

  .rail-button.is-active {
    color: #7fafff;
    border-color: rgba(96, 151, 255, 0.18);
    background: rgba(70, 126, 232, 0.12);
  }

  .mini-program-entry {
    position: relative;
    width: 100%;
    margin-top: 30px;
  }

  .mini-program-popover {
    position: absolute;
    left: 70px;
    bottom: 0;
    width: 210px;
    padding: 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 18px;
    background: rgba(24, 25, 30, 0.97);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(18px);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateX(-6px);
    transition: opacity 150ms ease, transform 150ms ease, visibility 150ms;
  }

  .mini-program-entry:hover .mini-program-popover,
  .mini-program-entry:focus-within .mini-program-popover {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateX(0);
  }

  .mini-program-entry:hover .mini-program-button,
  .mini-program-entry:focus-within .mini-program-button {
    color: #7fafff;
    border-color: rgba(96, 151, 255, 0.18);
    background: rgba(70, 126, 232, 0.12);
  }

  .mini-program-popover::before {
    content: "";
    position: absolute;
    left: -6px;
    bottom: 22px;
    width: 11px;
    height: 11px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: #18191e;
    transform: rotate(45deg);
  }

  .mini-program-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    color: #f3f4f6;
    font-size: 12px;
    font-weight: 600;
  }

  .mini-program-badge {
    padding: 3px 6px;
    border-radius: 99px;
    background: rgba(68, 203, 113, 0.12);
    color: #62d98b;
    font-size: 9px;
    font-weight: 500;
  }

  .mini-program-popover img {
    width: 100%;
    display: block;
    border-radius: 11px;
    background: #fff;
  }

  .mini-program-popover p {
    margin-top: 9px;
    color: rgba(225, 228, 234, 0.42);
    font-size: 10px;
    line-height: 1.5;
    text-align: center;
  }

  .desktop-sidebar {
    min-width: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 22px;
    padding: 32px 25px 34px;
    background: #121318;
    border-right: 1px solid rgba(255, 255, 255, 0.055);
    scrollbar-width: thin;
    scrollbar-color: rgba(143, 154, 172, 0.18) transparent;
  }

  .desktop-sidebar::-webkit-scrollbar {
    width: 5px;
  }

  .desktop-sidebar::-webkit-scrollbar-track {
    background: transparent;
  }

  .desktop-sidebar::-webkit-scrollbar-thumb {
    background: rgba(129, 144, 166, 0.24);
    border-radius: 999px;
  }

  .desktop-heading {
    padding: 2px 2px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  .desktop-heading p {
    margin-bottom: 9px;
    color: rgba(126, 172, 255, 0.7);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.18em;
  }

  .desktop-heading span {
    display: block;
    margin-top: 7px;
    color: rgba(228, 230, 236, 0.35);
    font-size: 11px;
  }

  .desktop-title {
    font-size: 24px;
    font-weight: 650;
    letter-spacing: -0.02em;
  }

  .desktop-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    scroll-margin-top: 24px;
  }

  .desktop-section + .desktop-section {
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.055);
  }

  .upload-dropzone {
    min-height: 116px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: 1px dashed rgba(160, 171, 189, 0.21);
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.022);
    color: rgba(255, 255, 255, 0.38);
    font: inherit;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, color 0.2s;
  }

  .upload-dropzone:hover,
  .upload-dropzone.is-dragging {
    border-color: rgba(103, 158, 255, 0.72);
    background: rgba(70, 126, 232, 0.08);
    color: rgba(255, 255, 255, 0.65);
  }

  .upload-title {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.42);
  }

  .upload-hint {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.22);
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    color: rgba(226, 229, 235, 0.48);
    letter-spacing: 0.1em;
  }

  .desktop-stage {
    min-width: 0;
    min-height: 0;
    padding: 40px 44px 30px;
    display: grid;
    grid-template-columns: minmax(0, 760px);
    grid-template-rows: auto auto auto;
    align-content: center;
    justify-content: center;
    gap: 14px;
    overflow: hidden;
  }

  .stage-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: rgba(229, 232, 238, 0.28);
    font-size: 10px;
    letter-spacing: 0.02em;
  }

  .stage-label span:first-child {
    color: rgba(229, 232, 238, 0.55);
    font-weight: 600;
    letter-spacing: 0.12em;
  }

  .desktop-canvas-area {
    width: 100%;
    height: min(64vh, 620px);
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 8px;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.055);
    border-radius: 24px;
    background:
      linear-gradient(45deg, rgba(255, 255, 255, 0.014) 25%, transparent 25%) 0 0 / 18px 18px,
      linear-gradient(-45deg, rgba(255, 255, 255, 0.014) 25%, transparent 25%) 0 9px / 18px 18px,
      #0c0d11;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
  }

  .desktop-canvas-area canvas {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
  }

  .stage-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 48px;
  }

  .generate-button {
    min-width: 156px;
    height: 46px;
    padding: 0 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 0;
    border-radius: 12px;
    background: linear-gradient(135deg, #6ba4ff, #4d82ed);
    box-shadow: 0 10px 28px rgba(53, 105, 211, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.22);
    color: white;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: 160ms ease;
  }

  .generate-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 13px 34px rgba(53, 105, 211, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.22);
  }

  .generate-button:disabled {
    opacity: 0.5;
    cursor: wait;
  }

  .desktop-history {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .stage-icon-button,
  .stage-text-button {
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.075);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.025);
    color: rgba(230, 233, 239, 0.52);
    font: inherit;
    cursor: pointer;
    transition: 150ms ease;
  }

  .stage-icon-button {
    width: 38px;
  }

  .stage-text-button {
    gap: 6px;
    padding: 0 12px;
    font-size: 11px;
  }

  .stage-icon-button:hover:not(:disabled),
  .stage-text-button:hover {
    color: rgba(255, 255, 255, 0.85);
    background: rgba(255, 255, 255, 0.055);
  }

  .stage-icon-button:disabled {
    opacity: 0.25;
    cursor: default;
  }
}

::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(129, 144, 166, 0.24);
  border-radius: 999px;
}
</style>
