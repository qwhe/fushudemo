<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast-wrap">
        <div class="toast" :class="type">{{ message }}</div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
const type = ref<'success' | 'error' | 'info'>('info')
let timer: ReturnType<typeof setTimeout>

function show(msg: string, t: 'success' | 'error' | 'info' = 'info', duration = 2000) {
  clearTimeout(timer)
  message.value = msg
  type.value = t
  visible.value = true
  timer = setTimeout(() => { visible.value = false }, duration)
}

defineExpose({ show })
</script>

<style scoped>
.toast-wrap {
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 999;
  pointer-events: none;
}
.toast {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  color: #fff;
  backdrop-filter: blur(8px);
  pointer-events: auto;
}
.toast.success { background: rgba(16, 185, 129, 0.9); }
.toast.error { background: rgba(239, 68, 68, 0.9); }
.toast.info { background: rgba(59, 130, 246, 0.9); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
