<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="blobUrl" class="export-overlay" @click.self="emit('close')">
        <div class="export-panel">
          <div class="export-header">
            <h3>表情包已生成</h3>
            <button class="close-btn" @click="emit('close')">✕</button>
          </div>
          <div class="export-hint">长按图片，选择保存图片或发送给朋友</div>
          <div class="export-image-wrap">
            <img :src="blobUrl" class="export-image" />
          </div>
          <div class="export-actions">
            <button class="export-btn primary" @click="emit('download')">下载图片</button>
            <button v-if="showShare" class="export-btn" @click="emit('share')">分享</button>
            <button v-if="showCopy" class="export-btn" @click="emit('copy')">复制图片</button>
          </div>
        </div>
      </div>
    </Transition>
    <Transition name="fade">
      <div v-if="exporting" class="loading-overlay">
        <div class="loading-spinner" />
        <div class="loading-text">正在生成...</div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{
  blobUrl: string | null
  exporting: boolean
}>()

const emit = defineEmits<{
  (e: 'download'): void
  (e: 'share'): void
  (e: 'copy'): void
  (e: 'close'): void
}>()

const showShare = ref(false)
const showCopy = ref(false)

onMounted(() => {
  showShare.value = !!navigator.share
  showCopy.value = !!(navigator.clipboard && typeof ClipboardItem !== 'undefined')
})
</script>

<style scoped>
.export-overlay, .loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.export-panel {
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  background: #1a1e2e;
  border-radius: 16px;
  padding: 20px;
  overflow-y: auto;
}
.export-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.export-header h3 {
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
.export-hint {
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  margin-bottom: 12px;
}
.export-image-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
.export-image {
  max-width: 100%;
  max-height: 50vh;
  border-radius: 8px;
}
.export-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.export-btn {
  flex: 1;
  min-width: 100px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: #ddd;
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
}
.export-btn.primary {
  background: #4da6ff;
  border-color: #4da6ff;
  color: #fff;
}
.export-btn:active { transform: scale(0.96); }
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #4da6ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text {
  color: #f0f0f0;
  text-align: center;
  font-size: 15px;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
