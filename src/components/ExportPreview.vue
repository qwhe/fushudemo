<template>
  <Teleport to="body">
    <Transition name="fade">
      <!-- Full-screen image display for easy long-press -->
      <div v-if="blobUrl" class="export-overlay" @click.self="emit('close')">
        <div class="export-panel">
          <div class="export-header">
            <h3>表情包已生成</h3>
            <button class="close-btn" @click="emit('close')">✕</button>
          </div>

          <div class="export-hint">
            {{ isWeChat ? '👇 长按下方图片，选择「保存到手机」或「转发给朋友」' : '长按图片保存，或点击下方按钮' }}
          </div>

          <!-- Large image area for easy long-press -->
          <div class="export-image-wrap">
            <img :src="blobUrl" class="export-image" />
          </div>

          <div class="export-actions">
            <template v-if="!isWeChat">
              <button class="export-btn primary" @click="emit('download')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                保存图片
              </button>
              <button v-if="showShare" class="export-btn share-btn" @click="emit('share')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                发送给好友
              </button>
              <button v-if="showCopy" class="export-btn" @click="emit('copy')">复制图片</button>
            </template>

            <template v-else>
              <button class="export-btn primary" @click="emit('download')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                保存图片
              </button>
            </template>
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

const showCopy = ref(false)
const showShare = ref(false)
const isWeChat = ref(false)

onMounted(() => {
  const ua = navigator.userAgent.toLowerCase()
  isWeChat.value = /micromessenger/i.test(ua)
  showShare.value = typeof navigator.share === 'function'
  showCopy.value = !!(navigator.clipboard && typeof ClipboardItem !== 'undefined')
})
</script>

<style scoped>
.export-overlay, .loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.export-panel {
  width: 92%;
  max-width: 420px;
  max-height: 92vh;
  background: #1a1e2e;
  border-radius: 16px;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.export-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  color: rgba(255,255,255,0.6);
  font-size: 13px;
  text-align: center;
  line-height: 1.5;
}
.export-image-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 8px;
}
.export-image {
  width: 100%;
  max-height: 50vh;
  border-radius: 8px;
  display: block;
  /* Prevent browser from treating as background */
  -webkit-user-select: auto;
  user-select: auto;
  -webkit-touch-callout: default;
  touch-callout: default;
  pointer-events: auto;
}
.export-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.export-btn {
  flex: 1;
  min-width: 90px;
  padding: 11px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: #ddd;
  font-size: 13px;
  cursor: pointer;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.export-btn.primary {
  background: #4da6ff;
  border-color: #4da6ff;
  color: #fff;
}
.share-btn {
  background: #07c160;
  border-color: #07c160;
  color: #fff;
}
.export-btn:active { transform: scale(0.96); }
.wechat-guide {
  width: 100%;
  text-align: center;
}
.wechat-arrow {
  font-size: 28px;
  margin-bottom: 4px;
}
.wechat-tip {
  color: rgba(255,255,255,0.7);
  font-size: 15px;
  padding: 12px;
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
}
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
