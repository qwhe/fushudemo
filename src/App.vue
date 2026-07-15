<template>
  <div class="app">
    <!-- Mobile Layout -->
    <div class="mobile-layout">
      <header class="mobile-header">
        <h1 class="app-title">鼠鼠嘴替</h1>
        <div class="header-actions">
          <button class="icon-btn" @click="triggerUpload" title="换背景图" aria-label="换背景图">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </button>
          <button class="icon-btn" :disabled="!history.canUndo.value" @click="onUndo" title="撤销" aria-label="撤销">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h13a4 4 0 010 8H9"/><path d="M7 6l-4 4 4 4"/></svg>
          </button>
          <button class="icon-btn" :disabled="!history.canRedo.value" @click="onRedo" title="重做" aria-label="重做">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10H8a4 4 0 000 8h7"/><path d="M17 6l4 4-4 4"/></svg>
          </button>
          <button class="icon-btn" @click="confirmRestart" title="重新开始" aria-label="重新开始">
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
      <aside class="desktop-sidebar">
        <h1 class="app-title desktop-title">鼠鼠嘴替</h1>

        <section class="desktop-section">
          <h3 class="section-title">背景</h3>
          <button class="btn-secondary" @click="triggerUpload">换背景图</button>
          <input type="file" ref="fileInputRef2" accept="image/*" @change="onFileSelected" style="display:none" />
        </section>

        <section class="desktop-section">
          <h3 class="section-title">文案</h3>
          <WordCloud @select="onCaptionSelect" />
        </section>

        <section class="desktop-section">
          <h3 class="section-title">文字样式</h3>
          <StyleToolbar
            v-if="activeLayer"
            :layer="activeLayer"
            @update:layer="onStyleUpdate"
            @reset="onReset"
          />
        </section>

        <section class="desktop-section">
          <h3 class="section-title">生成与分享</h3>
          <div class="desktop-actions">
            <button class="btn-primary" @click="onExport" :disabled="exp.exporting.value">
              {{ exp.exporting.value ? '正在生成...' : '生成表情包' }}
            </button>
          </div>
          <div class="desktop-history">
            <button class="icon-btn" :disabled="!history.canUndo.value" @click="onUndo">撤销</button>
            <button class="icon-btn" :disabled="!history.canRedo.value" @click="onRedo">重做</button>
            <button class="icon-btn danger" @click="confirmRestart">重新开始</button>
          </div>
        </section>
      </aside>

      <main class="desktop-canvas-area" ref="canvasAreaRef2">
        <MemeCanvas
          :project="project"
          :background-image="bgImage"
          @update:layer="onDragLayer"
          @edit="onStartEdit"
          @gesture-start="onGestureStart"
          @gesture-end="onGestureEnd"
        />
        <!-- Inline text editor overlay for desktop -->
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
      </main>
    </div>

    <ImageCropper ref="cropperRef" @cropped="onCropped" />

    <!-- Reset confirmation dialog -->
    <div v-if="showResetConfirm" class="confirm-overlay" @click.self="cancelReset">
      <div class="confirm-dialog">
        <p class="confirm-message">确定要重新开始吗？<br/>将恢复默认背景图和文案</p>
        <div class="confirm-actions">
          <button class="btn-secondary" @click="cancelReset">取消</button>
          <button class="btn-secondary btn-danger" @click="doReset">确定重置</button>
        </div>
      </div>
    </div>

    <Toast ref="toastRef" />

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
import { ref, computed, onMounted, nextTick, triggerRef } from 'vue'
import type { TextLayer, MemeProject } from './types/meme'
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
})

function triggerUpload() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = ''
  const reader = new FileReader()
  reader.onload = () => {
    cropperRef.value?.open(reader.result as string)
  }
  reader.readAsDataURL(file)
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
    reader.onerror = () => {
      toastRef.value?.show('生成预览失败，请重试', 'error')
    }
    reader.readAsDataURL(exportBlob)
  } catch {
    toastRef.value?.show('生成失败，请重试', 'error')
  }
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
  background: #0d1117;
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
  padding: 12px 8px 0;
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
    display: flex;
    height: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px 32px;
    gap: 32px;
    overflow: hidden;
  }

  .desktop-sidebar {
    width: 340px;
    flex-shrink: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-right: 8px;
  }

  .desktop-title {
    font-size: 22px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .desktop-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .desktop-canvas-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    min-width: 0;
    position: relative;
  }

  .canvas-area {
    padding: 8px;
  }

  .desktop-canvas-area canvas {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
  }

  .desktop-actions {
    display: flex;
    gap: 8px;
  }

  .desktop-actions .btn-primary {
    flex: 1;
  }

  .desktop-history {
    display: flex;
    gap: 6px;
    margin-top: 4px;
  }

  .desktop-history .icon-btn {
    flex: 1;
    font-size: 12px;
  }
}

::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
</style>
