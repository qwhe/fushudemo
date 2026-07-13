<template>
  <textarea
    ref="textareaRef"
    class="text-editor"
    :value="text"
    @input="onInput"
    placeholder="输入表情包文案..."
    rows="1"
    maxlength="150"
  />
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{ text: string }>()
const emit = defineEmits<{
  (e: 'update:text', value: string): void
}>()

const textareaRef = ref<HTMLTextAreaElement>()

function autoGrow() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function onInput(e: Event) {
  emit('update:text', (e.target as HTMLTextAreaElement).value)
  autoGrow()
}

watch(() => props.text, () => nextTick(autoGrow))
</script>

<style scoped>
.text-editor {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #f0f0f0;
  font-size: 15px;
  padding: 12px 14px;
  resize: none;
  outline: none;
  font-family: inherit;
  line-height: 1.5;
  min-height: 44px;
  max-height: 120px;
  overflow-y: auto;
  transition: border-color 0.2s;
}
.text-editor:focus {
  border-color: #4da6ff;
}
.text-editor::placeholder {
  color: rgba(255, 255, 255, 0.3);
}
</style>
