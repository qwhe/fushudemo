<template>
  <div class="word-cloud">
    <div class="cloud-scroll">
      <button
        v-for="(item, i) in shuffledCaptions"
        :key="i"
        class="cloud-tag"
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
  return shuffled.map((text) => ({ text }))
})
</script>

<style scoped>
.word-cloud {
  padding: 2px 0;
  overflow: hidden;
}
.cloud-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  max-height: 180px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px 0 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(129, 144, 166, 0.28) transparent;
}
.cloud-scroll::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.cloud-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.cloud-scroll::-webkit-scrollbar-thumb {
  background: rgba(129, 144, 166, 0.28);
  border-radius: 999px;
}
.cloud-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(129, 144, 166, 0.44);
}
.cloud-tag {
  max-width: 100%;
  padding: 6px 11px;
  border-radius: 9px;
  border: 1px solid rgba(151, 164, 181, 0.11);
  background: rgba(151, 164, 181, 0.055);
  color: rgba(231, 236, 243, 0.68);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.18s, background 0.18s, border-color 0.18s, transform 0.18s;
  white-space: normal;
  text-align: left;
  line-height: 1.45;
}
.cloud-tag:hover,
.cloud-tag:active {
  background: rgba(88, 166, 255, 0.12);
  border-color: rgba(88, 166, 255, 0.26);
  color: rgba(255, 255, 255, 0.92);
  transform: translateY(-1px);
}
@media (min-width: 768px) {
  .cloud-scroll {
    gap: 8px;
  }
  .cloud-tag {
    padding: 7px 12px;
    font-size: 13px;
    line-height: 1.5;
  }
}
</style>
