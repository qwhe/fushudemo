<template>
  <div class="word-cloud">
    <div class="cloud-scroll">
      <button
        v-for="(item, i) in shuffledCaptions"
        :key="i"
        class="cloud-tag"
        :style="{ fontSize: item.size + 'px', opacity: item.opacity }"
        @click="emit('select', item.text)"
      >
        {{ item.text }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { captionCategories } from '../data/captions'

const emit = defineEmits<{
  (e: 'select', text: string): void
}>()

const shuffledCaptions = computed(() => {
  const all = captionCategories.flatMap((c) => c.captions)
  const shuffled = [...all].sort(() => Math.random() - 0.5)
  return shuffled.map((text) => ({
    text,
    size: 11 + Math.random() * 5,
    opacity: 0.5 + Math.random() * 0.5,
  }))
})
</script>

<style scoped>
.word-cloud {
  padding: 8px 0;
  overflow: hidden;
}
.cloud-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  padding: 0 16px;
}
.cloud-tag {
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  line-height: 1.4;
}
.cloud-tag:hover,
.cloud-tag:active {
  background: rgba(77, 166, 255, 0.15);
  border-color: rgba(77, 166, 255, 0.4);
  color: #fff;
}
</style>
