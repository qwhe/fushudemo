<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="drawer-overlay" @click.self="emit('update:open', false)">
        <div class="drawer-panel">
          <div class="drawer-header">
            <h3>灵感文案</h3>
            <button class="close-btn" @click="emit('update:open', false)">✕</button>
          </div>
          <button class="random-btn" @click="emit('random')">随机一句</button>
          <div class="categories">
            <button
              v-for="cat in categories"
              :key="cat.name"
              class="cat-tab"
              :class="{ active: activeCategory === cat.name }"
              @click="activeCategory = cat.name"
            >{{ cat.name }}</button>
          </div>
          <div class="caption-list">
            <button
              v-for="(cap, i) in currentCaptions"
              :key="i"
              class="caption-item"
              @click="emit('select', cap)"
            >{{ cap }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { captionCategories } from '../data/captions'

defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'select', caption: string): void
  (e: 'random'): void
}>()

const categories = captionCategories
const activeCategory = ref(categories[0]?.name ?? '')

const currentCaptions = computed(() => {
  const cat = categories.find((c) => c.name === activeCategory.value)
  return cat?.captions ?? []
})
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.drawer-panel {
  width: 100%;
  max-width: 600px;
  max-height: 70vh;
  background: #1a1e2e;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.drawer-header h3 {
  color: #f0f0f0;
  font-size: 18px;
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
.random-btn {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #4da6ff;
  background: rgba(77,166,255,0.1);
  color: #4da6ff;
  font-size: 15px;
  cursor: pointer;
  margin-bottom: 12px;
}
.random-btn:active { transform: scale(0.98); }
.categories {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.cat-tab {
  padding: 4px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05);
  color: #aaa;
  font-size: 13px;
  cursor: pointer;
}
.cat-tab.active {
  background: rgba(77,166,255,0.15);
  border-color: #4da6ff;
  color: #4da6ff;
}
.caption-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.caption-item {
  text-align: left;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #e0e0e0;
  font-size: 14px;
  cursor: pointer;
  line-height: 1.4;
  min-height: 44px;
  transition: background 0.2s;
}
.caption-item:active {
  background: rgba(77,166,255,0.1);
}
</style>
