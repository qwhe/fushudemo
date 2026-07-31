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
    <div class="tool-row rotation-row">
      <label>旋转</label>
      <input type="range" :min="-180" :max="180" v-model.number="rotation" class="slider" />
      <span class="value">{{ rotation }}°</span>
      <button class="toggle-btn small" @click="updateProp('rotation', 0)" title="重置旋转">0°</button>
    </div>
    <div class="tool-row">
      <label>字号</label>
      <input type="range" :min="16" :max="120" v-model.number="fontSize" class="slider" />
      <span class="value">{{ fontSize }}</span>
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
      <div class="stroke-controls">
        <button class="toggle-btn" :class="{ active: layer.strokeEnabled }" @click="updateProp('strokeEnabled', !layer.strokeEnabled)">描边</button>
        <template v-if="layer.strokeEnabled">
          <input type="color" :value="layer.strokeColor" @input="updateProp('strokeColor', ($event.target as HTMLInputElement).value)" class="color-picker small" />
          <input type="range" :min="0" :max="8" v-model.number="strokeWidth" class="slider" />
          <span class="value">{{ strokeWidth }}</span>
        </template>
      </div>
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
  gap: 13px;
}
.tool-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}
.tool-row label {
  color: rgba(216, 224, 234, 0.48);
  font-size: 12px;
  letter-spacing: 0.02em;
}
.value {
  color: rgba(116, 184, 255, 0.9);
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  min-width: 32px;
  text-align: right;
}
.rotation-row {
  grid-template-columns: 42px minmax(0, 1fr) 32px 34px;
}
.stroke-controls {
  grid-column: 2 / -1;
  display: grid;
  grid-template-columns: auto auto minmax(70px, 1fr) 24px;
  align-items: center;
  gap: 8px;
}
.stroke-controls > .toggle-btn {
  min-width: 56px;
}
.slider {
  flex: 1;
  min-width: 80px;
  width: 100%;
  height: 18px;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  cursor: pointer;
}
.slider::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 999px;
  background: rgba(172, 184, 199, 0.19);
}
.slider::-webkit-slider-thumb {
  width: 14px;
  height: 14px;
  margin-top: -5.5px;
  appearance: none;
  -webkit-appearance: none;
  border: 3px solid #0f141a;
  border-radius: 50%;
  background: #67b2ff;
  box-shadow: 0 0 0 1px rgba(103, 178, 255, 0.28);
}
.slider::-moz-range-track {
  height: 3px;
  border: 0;
  border-radius: 999px;
  background: rgba(172, 184, 199, 0.19);
}
.slider::-moz-range-progress {
  height: 3px;
  border-radius: 999px;
  background: rgba(103, 178, 255, 0.7);
}
.slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border: 3px solid #0f141a;
  border-radius: 50%;
  background: #67b2ff;
}
.color-presets {
  display: flex;
  gap: 8px;
  align-items: center;
  grid-column: 2 / -1;
}
.color-btn {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: box-shadow 0.18s, transform 0.18s;
}
.color-btn.active {
  border-color: #0f141a;
  box-shadow: 0 0 0 2px rgba(103, 178, 255, 0.88);
  transform: scale(1.04);
}
.color-btn[data-bg="#000000"], .color-btn[data-bg="black"] {
  border: 2px solid rgba(255,255,255,0.3);
}
.color-picker {
  width: 25px;
  height: 25px;
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 7px;
  cursor: pointer;
  background: rgba(255,255,255,0.05);
  padding: 2px;
}
.color-picker.small {
  width: 24px;
  height: 24px;
}
.btn-group {
  display: flex;
  gap: 5px;
  grid-column: 2 / -1;
}
.toggle-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(151, 164, 181, 0.13);
  background: rgba(151, 164, 181, 0.055);
  color: rgba(231, 236, 243, 0.66);
  font-size: 12px;
  cursor: pointer;
  min-width: 40px;
  min-height: 34px;
  transition: color 0.18s, background 0.18s, border-color 0.18s, transform 0.18s;
}
.toggle-btn.small {
  padding: 4px 8px;
  min-width: 32px;
  min-height: 28px;
  font-size: 12px;
}
.toggle-btn.active {
  background: rgba(88, 166, 255, 0.13);
  border-color: rgba(103, 178, 255, 0.5);
  color: #80beff;
}
.toggle-btn:hover {
  border-color: rgba(151, 164, 181, 0.28);
  color: rgba(255,255,255,0.9);
}
.actions {
  display: flex;
  margin-top: 2px;
}
.action-btn {
  padding: 7px 13px;
  border-radius: 8px;
  border: 1px solid rgba(151, 164, 181, 0.13);
  background: transparent;
  color: rgba(231, 236, 243, 0.56);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.18s, background 0.18s;
  min-height: 34px;
}
.action-btn:active {
  transform: scale(0.96);
}
@media (min-width: 768px) {
  .style-toolbar {
    gap: 18px;
  }
  .tool-row {
    min-height: 36px;
    gap: 12px;
  }
  .tool-row label {
    font-size: 13px;
  }
}
</style>
