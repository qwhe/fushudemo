<template>
  <div class="style-toolbar">
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
      <label>粗体</label>
      <button class="toggle-btn" :class="{ active: layer.fontWeight === 'bold' }" @click="updateProp('fontWeight', layer.fontWeight === 'bold' ? 'normal' : 'bold')">B</button>
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
    <div class="tool-row">
      <label>对齐</label>
      <div class="btn-group">
        <button v-for="a in aligns" :key="a.value" class="toggle-btn" :class="{ active: layer.align === a.value }" @click="updateProp('align', a.value)">{{ a.label }}</button>
      </div>
    </div>
    <div class="tool-row">
      <label>行距</label>
      <div class="btn-group">
        <button v-for="lh in lineHeights" :key="lh.value" class="toggle-btn" :class="{ active: Math.abs(layer.lineHeight - lh.value) < 0.05 }" @click="updateProp('lineHeight', lh.value)">{{ lh.label }}</button>
      </div>
    </div>
    <div class="tool-row">
      <label>阴影</label>
      <button class="toggle-btn" :class="{ active: layer.shadowEnabled }" @click="updateProp('shadowEnabled', !layer.shadowEnabled)">阴影</button>
      <template v-if="layer.shadowEnabled">
        <input type="color" :value="layer.shadowColor" @input="updateProp('shadowColor', ($event.target as HTMLInputElement).value)" class="color-picker small" />
        <input type="range" :min="0" :max="20" v-model.number="shadowBlur" class="slider" />
        <span class="value">{{ shadowBlur }}</span>
      </template>
    </div>
    <div class="tool-row">
      <label>旋转</label>
      <input type="range" :min="-180" :max="180" v-model.number="rotation" class="slider" />
      <span class="value">{{ rotation }}°</span>
      <button class="toggle-btn small" @click="updateProp('rotation', 0)">归零</button>
    </div>
    <div class="tool-row actions">
      <button class="action-btn classic" @click="emit('classic')">经典样式</button>
      <button class="action-btn" @click="emit('center')">水平居中</button>
      <button class="action-btn" @click="emit('reset')">恢复默认</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TextLayer } from '../types/meme'

const props = defineProps<{ layer: TextLayer }>()
const emit = defineEmits<{
  (e: 'update:layer', id: string, changes: Partial<TextLayer>): void
  (e: 'classic'): void
  (e: 'center'): void
  (e: 'reset'): void
}>()

const fontSize = ref(props.layer.fontSize)
const strokeWidth = ref(props.layer.strokeWidth)
const shadowBlur = ref(props.layer.shadowBlur)
const rotation = ref(props.layer.rotation)
watch(() => props.layer.fontSize, (v) => { fontSize.value = v })
watch(() => props.layer.strokeWidth, (v) => { strokeWidth.value = v })
watch(() => props.layer.shadowBlur, (v) => { shadowBlur.value = v })
watch(() => props.layer.rotation, (v) => { rotation.value = v })
watch(fontSize, (v) => updateProp('fontSize', v))
watch(strokeWidth, (v) => updateProp('strokeWidth', v))
watch(shadowBlur, (v) => updateProp('shadowBlur', v))
watch(rotation, (v) => updateProp('rotation', v))

const colorPresets = ['#ffffff', '#000000', '#ffdd00', '#ff3333']
const aligns = [
  { value: 'left' as const, label: '左' },
  { value: 'center' as const, label: '中' },
  { value: 'right' as const, label: '右' },
]
const lineHeights = [
  { value: 1.1, label: '紧凑' },
  { value: 1.3, label: '标准' },
  { value: 1.6, label: '宽松' },
]

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
.toggle-btn.active {
  background: rgba(77,166,255,0.2);
  border-color: #4da6ff;
  color: #4da6ff;
}
.btn-group {
  display: flex;
  gap: 4px;
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
.action-btn.classic {
  background: rgba(77,166,255,0.15);
  border-color: #4da6ff;
  color: #4da6ff;
}
</style>
