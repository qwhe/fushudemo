<template>
  <div class="style-toolbar">
    <div class="tool-row">
      <label>字体</label>
      <div class="btn-group">
        <button
          v-for="f in fontOptions"
          :key="f.value"
          class="toggle-btn"
          :class="{ active: currentFont === f.value }"
          @click="selectFont(f.value)"
        >
          {{ f.label }}
        </button>
      </div>
    </div>
    <div class="tool-row">
      <label>字号</label>
      <input type="range" :min="16" :max="120" v-model.number="fontSize" class="slider" />
      <span class="value">{{ fontSize }}</span>
    </div>
    <div class="tool-row">
      <label>旋转</label>
      <input type="range" :min="-180" :max="180" v-model.number="rotation" class="slider" />
      <span class="value">{{ rotation }}°</span>
      <button class="toggle-btn small" @click="updateProp('rotation', 0)" title="重置旋转">0°</button>
    </div>
    <div class="tool-row">
      <label>颜色</label>
      <div class="color-presets">
        <button v-for="c in colorPresets" :key="c" class="color-btn" :class="{ active: layer.color === c }"
          :style="{ background: c }" @click="updateProp('color', c)" />
        <input type="color" :value="layer.color" @input="updateProp('color', ($event.target as HTMLInputElement).value)" class="color-picker" />
      </div>
    </div>
    <div class="tool-row">
      <label>描边</label>
      <button class="toggle-btn" :class="{ active: layer.strokeEnabled }" @click="updateProp('strokeEnabled', !layer.strokeEnabled)">描边</button>
      <template v-if="layer.strokeEnabled">
        <input type="color" :value="layer.strokeColor" @input="updateProp('strokeColor', ($event.target as HTMLInputElement).value)" class="color-picker small" />
        <input type="range" :min="0" :max="8" v-model.number="strokeWidth" class="slider" />
        <span class="value">{{ strokeWidth }}</span>
      </template>
    </div>
    <div class="tool-row actions">
      <button class="action-btn" @click="emit('reset')">恢复默认</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { TextLayer } from '../types/meme'

const props = defineProps<{ layer: TextLayer }>()
const emit = defineEmits<{
  (e: 'update:layer', id: string, changes: Partial<TextLayer>): void
  (e: 'reset'): void
}>()

const fontSize = ref(props.layer.fontSize)
const strokeWidth = ref(props.layer.strokeWidth)
const rotation = ref(props.layer.rotation ?? 0)
watch(() => props.layer.fontSize, (v) => { fontSize.value = v })
watch(() => props.layer.strokeWidth, (v) => { strokeWidth.value = v })
watch(() => props.layer.rotation, (v) => { rotation.value = v ?? 0 })
watch(fontSize, (v) => updateProp('fontSize', v))
watch(strokeWidth, (v) => updateProp('strokeWidth', v))
watch(rotation, (v) => updateProp('rotation', v))

const fontOptions = [
  { value: 'cute', label: '可爱', family: '"ZCOOL KuaiLe", cursive', weight: 'normal' as const },
  { value: 'heiti', label: '黑体', family: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif', weight: 'bold' as const },
  { value: 'extra', label: '超粗', family: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif', weight: 'extra-bold' as const },
]

const currentFont = computed(() => {
  const match = fontOptions.find(f => f.family === props.layer.fontFamily && f.weight === props.layer.fontWeight)
  return match?.value ?? 'heiti'
})

function selectFont(value: string) {
  const option = fontOptions.find(f => f.value === value)
  if (!option) return
  emit('update:layer', props.layer.id, {
    fontFamily: option.family,
    fontWeight: option.weight,
  })
}

const colorPresets = ['#ffffff', '#4ade80', '#ffdd00', '#ff3333']

function updateProp(key: string, value: any) {
  emit('update:layer', props.layer.id, { [key]: value })
}
</script>

<style scoped>
.style-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tool-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tool-row label {
  color: rgba(255,255,255,0.6);
  font-size: 13px;
  min-width: 36px;
}
.value {
  color: #4da6ff;
  font-size: 13px;
  min-width: 28px;
}
.slider {
  flex: 1;
  min-width: 80px;
  accent-color: #4da6ff;
  height: 4px;
}
.color-presets {
  display: flex;
  gap: 6px;
  align-items: center;
}
.color-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.2s;
}
.color-btn.active {
  border-color: #4da6ff;
}
.color-btn[data-bg="#000000"], .color-btn[data-bg="black"] {
  border: 2px solid rgba(255,255,255,0.3);
}
.color-picker {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: none;
  padding: 0;
}
.color-picker.small {
  width: 24px;
  height: 24px;
}
.btn-group {
  display: flex;
  gap: 4px;
}
.toggle-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: #ddd;
  font-size: 13px;
  cursor: pointer;
  min-width: 40px;
  min-height: 36px;
  transition: all 0.2s;
}
.toggle-btn.small {
  padding: 4px 8px;
  min-width: 32px;
  min-height: 28px;
  font-size: 12px;
}
.toggle-btn.active {
  background: rgba(77,166,255,0.2);
  border-color: #4da6ff;
  color: #4da6ff;
}
.actions {
  gap: 6px;
  margin-top: 4px;
}
.action-btn {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: #ddd;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 36px;
}
.action-btn:active {
  transform: scale(0.96);
}
</style>
