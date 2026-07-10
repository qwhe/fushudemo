<template>
  <div class="app">
    <!-- Mobile Layout -->
    <div class="mobile-layout">
      <header class="mobile-header">
        <h1 class="app-title">负鼠有话说</h1>
        <div class="header-actions">
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
      </header>

      <div class="canvas-area">
        <MemeCanvas
          :project="project"
          :background-image="bgImage"
          @update:layer="onDragLayer"
        />
      </div>

      <div class="editor-area">
        <TextEditor
          :text="activeLayer?.text ?? ''"
          @update:text="onTextChange"
        />

        <div class="toolbar-toggle" @click="showToolbar = !showToolbar">
          <span>{{ showToolbar ? '收起样式' : '文字样式' }}</span>
          <svg :class="{ rotated: showToolbar }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>

        <StyleToolbar
          v-if="showToolbar && activeLayer"
          :layer="activeLayer"
          @update:layer="onStyleUpdate"
          @classic="onClassic"
          @center="onCenter"
          @reset="onReset"
        />
      </div>

      <div class="bottom-actions">
        <button class="btn-secondary" @click="captionOpen = true">灵感文案</button>
        <button class="btn-primary" @click="onExport" :disabled="exp.exporting.value">
          {{ exp.exporting.value ? '生成中...' : '生成表情' }}
        </button>
      </div>
    </div>

    <!-- Desktop Layout -->
    <div class="desktop-layout">
      <aside class="desktop-sidebar">
        <h1 class="app-title desktop-title">负鼠有话说</h1>

        <section class="desktop-section">
          <h3 class="section-title">文案</h3>
          <TextEditor
            :text="activeLayer?.text ?? ''"
            @update:text="onTextChange"
          />
          <div class="desktop-caption-row">
            <button class="btn-secondary small" @click="captionOpen = true">灵感文案</button>
            <button class="btn-secondary small" @click="onRandom">随机一句</button>
          </div>
        </section>

        <section class="desktop-section">
          <h3 class="section-title">文字样式</h3>
          <StyleToolbar
            v-if="activeLayer"
            :layer="activeLayer"
            @update:layer="onStyleUpdate"
            @classic="onClassic"
            @center="onCenter"
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

      <main class="desktop-canvas-area">
        <MemeCanvas
          :project="project"
          :background-image="bgImage"
          @update:layer="onDragLayer"
        />
      </main>
    </div>

    <CaptionDrawer
      :open="captionOpen"
      @update:open="captionOpen = $event"
      @select="onCaptionSelect"
      @random="onRandom"
    />

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
import { ref, computed, onMounted } from 'vue'
import type { TextLayer } from './types/meme'
import { useMemeProject } from './composables/useMemeProject'
import { useHistory } from './composables/useHistory'
import { useExport } from './composables/useExport'
import { useShare } from './composables/useShare'
import { getRandomCaption } from './data/captions'
import MemeCanvas from './components/MemeCanvas.vue'
import TextEditor from './components/TextEditor.vue'
import StyleToolbar from './components/StyleToolbar.vue'
import CaptionDrawer from './components/CaptionDrawer.vue'
import ExportPreview from './components/ExportPreview.vue'
import baseImageSrc from './assets/opossum-base.png'

const {
  project,
  activeTextLayer: activeLayer,
  updateLayer,
  applyClassicStyle,
  centerHorizontal,
  resetStyle,
  restart,
} = useMemeProject()

const history = useHistory()
const exp = useExport()
const share = useShare()

const bgImage = ref<HTMLImageElement | null>(null)
const captionOpen = ref(false)
const showToolbar = ref(false)
const exportBlobUrl = ref<string | null>(null)
let exportBlob: Blob | null = null

onMounted(() => {
  const img = new Image()
  img.onload = () => {
    bgImage.value = img
    // Set default text position based on image dimensions
    if (!project.textLayers[0].text && project.textLayers[0].x === 0 && project.textLayers[0].y === 0) {
      project.textLayers[0].maxWidth = img.naturalWidth * 0.85
      project.textLayers[0].x = img.naturalWidth * 0.075
      project.textLayers[0].y = img.naturalHeight * 0.55
    }
  }
  img.src = baseImageSrc
})

// --- Text change ---
function onTextChange(text: string) {
  history.pushState(JSON.parse(JSON.stringify(project)))
  updateLayer(activeLayer.value!.id, { text })
}

// --- Style change ---
function onStyleUpdate(id: string, changes: Partial<TextLayer>) {
  history.pushState(JSON.parse(JSON.stringify(project)))
  updateLayer(id, changes)
}

// --- Canvas drag ---
function onDragLayer(id: string, changes: Partial<{ x: number; y: number }>) {
  updateLayer(id, changes)
}

function onDragEnd() {
  // Save to history on drag end is tricky; we'll push history on significant changes
}

// --- Quick actions ---
function onClassic() {
  history.pushState(JSON.parse(JSON.stringify(project)))
  applyClassicStyle()
}

function onCenter() {
  history.pushState(JSON.parse(JSON.stringify(project)))
  centerHorizontal()
}

function onReset() {
  history.pushState(JSON.parse(JSON.stringify(project)))
  resetStyle()
}

// --- Undo / Redo ---
function onUndo() {
  const prev = history.undo(JSON.parse(JSON.stringify(project)))
  if (prev) Object.assign(project, prev)
}

function onRedo() {
  const next = history.redo(JSON.parse(JSON.stringify(project)))
  if (next) Object.assign(project, next)
}

// --- Restart ---
function confirmRestart() {
  if (window.confirm('确定要重新开始吗？当前编辑内容将被清除。')) {
    history.clearHistory()
    restart()
  }
}

// --- Caption ---
function onCaptionSelect(caption: string) {
  captionOpen.value = false
  history.pushState(JSON.parse(JSON.stringify(project)))
  updateLayer(activeLayer.value!.id, { text: caption })
}

function onRandom() {
  const caption = getRandomCaption()
  captionOpen.value = false
  history.pushState(JSON.parse(JSON.stringify(project)))
  updateLayer(activeLayer.value!.id, { text: caption })
}

// --- Export ---
async function onExport() {
  if (!bgImage.value) return
  try {
    exportBlob = await exp.generateExport(JSON.parse(JSON.stringify(project)), bgImage.value)
    exportBlobUrl.value = URL.createObjectURL(exportBlob)
  } catch {
    // Already exporting or error
  }
}

// --- Download / Share / Copy ---
function onDownload() {
  if (!exportBlob) return
  const ts = Math.floor(Date.now() / 1000)
  exp.downloadBlob(exportBlob, `opossum-meme-${ts}.png`)
}

async function onShare() {
  if (!exportBlob) return
  await share.shareWithFallback(exportBlob)
}

async function onCopy() {
  if (!exportBlob) return
  await share.clipboardCopy(exportBlob)
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

/* ---- Mobile Layout ---- */
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
  flex: 2;
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
  flex: 1;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #ddd;
  font-size: 14px;
  cursor: pointer;
  min-height: 48px;
  transition: all 0.2s;
}

.btn-secondary.small {
  flex: 1;
  min-height: 40px;
  padding: 8px 12px;
  font-size: 13px;
}

.btn-secondary:active {
  transform: scale(0.97);
  background: rgba(255, 255, 255, 0.1);
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
    padding: 24px 32px;
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

  .desktop-caption-row {
    display: flex;
    gap: 8px;
  }

  .desktop-canvas-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    min-width: 0;
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

/* Scrollbar */
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
