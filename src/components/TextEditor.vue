<template>
  <textarea
    class="text-editor"
    :value="text"
    @input="emit('update:text', ($event.target as HTMLTextAreaElement).value)"
    placeholder="输入表情包文案..."
    rows="2"
  />
</template>

<script setup lang="ts">
defineProps<{ text: string }>()
const emit = defineEmits<{
  (e: 'update:text', value: string): void
}>()
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
  min-height: 60px;
  transition: border-color 0.2s;
}
.text-editor:focus {
  border-color: #4da6ff;
}
.text-editor::placeholder {
  color: rgba(255, 255, 255, 0.3);
}
</style>
