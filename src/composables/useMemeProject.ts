import { ref, reactive, watch, computed } from 'vue'
import type { MemeProject, TextLayer } from '../types/meme'

const STORAGE_KEY = 'opossum-meme-project'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function defaultTextLayer(): TextLayer {
  return {
    id: generateId(),
    text: '大家都停✋一下，我有话说',
    x: 0,
    y: 0,
    maxWidth: 800,
    fontSize: 72,
    fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    fontWeight: 'extra-bold',
    color: '#ffffff',
    strokeEnabled: true,
    strokeColor: '#000000',
    strokeWidth: 4,
    align: 'center',
    lineHeight: 1.3,
    shadowEnabled: false,
    shadowColor: '#000000',
    shadowBlur: 4,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    rotation: 0,
  }
}

function createDefaultProject(): MemeProject {
  const layer = defaultTextLayer()
  return {
    backgroundSrc: '',
    textLayers: [layer],
    activeTextLayerId: layer.id,
  }
}

function ensureDefaults(project: MemeProject) {
  // Ensure default text if empty
  for (const layer of project.textLayers) {
    if (!layer.text || layer.text.trim() === '') {
      layer.text = '大家都停✋一下，我有话说'
    }
    // Ensure default font style
    if (!layer.fontFamily || layer.fontFamily.includes('system-ui')) {
      layer.fontFamily = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
    }
    if (layer.fontWeight === 'normal') {
      layer.fontWeight = 'extra-bold'
    }
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function useMemeProject() {
  const loaded = loadFromStorage()
  const project = reactive<MemeProject>(loaded ?? createDefaultProject())
  ensureDefaults(project)

  // Ensure there is always at least one text layer and an active layer id
  if (project.textLayers.length === 0) {
    const layer = defaultTextLayer()
    project.textLayers.push(layer)
    project.activeTextLayerId = layer.id
  }
  if (!project.activeTextLayerId) {
    project.activeTextLayerId = project.textLayers[0]?.id ?? null
  }

  // --- Active layer getter / setter ---
  const activeTextLayer = computed<TextLayer | null>(() => {
    return project.textLayers.find((l) => l.id === project.activeTextLayerId) ?? null
  })

  function setActiveTextLayerId(id: string) {
    project.activeTextLayerId = id
  }

  // --- Update text layer properties ---
  function updateLayer(id: string, changes: Partial<TextLayer>) {
    const layer = project.textLayers.find((l) => l.id === id)
    if (!layer) return
    Object.assign(layer, changes)
  }

  // --- Add / Delete text layer ---
  function addTextLayer(): TextLayer {
    const layer = defaultTextLayer()
    project.textLayers.push(layer)
    project.activeTextLayerId = layer.id
    return layer
  }

  function removeTextLayer(id: string) {
    const idx = project.textLayers.findIndex((l) => l.id === id)
    if (idx === -1) return
    project.textLayers.splice(idx, 1)
    // If the removed layer was active, switch to the first remaining layer
    if (project.activeTextLayerId === id) {
      project.activeTextLayerId = project.textLayers[0]?.id ?? null
    }
  }

  // --- Classic style preset ---
  function applyClassicStyle() {
    const layer = activeTextLayer.value
    if (!layer) return
    updateLayer(layer.id, {
      fontSize: 56,
      fontWeight: 'bold',
      color: '#ffffff',
      strokeEnabled: true,
      strokeColor: '#000000',
      strokeWidth: 4,
      align: 'center',
      lineHeight: 1.3,
      shadowEnabled: false,
      rotation: 0,
    })
  }

  // --- Horizontal center ---
  function centerHorizontal() {
    const layer = activeTextLayer.value
    if (!layer) return
    updateLayer(layer.id, {
      x: 0,
      align: 'center',
    })
  }

  // --- Reset to default style ---
  function resetStyle() {
    const layer = activeTextLayer.value
    if (!layer) return
    const defaults = defaultTextLayer()
    updateLayer(layer.id, {
      fontSize: defaults.fontSize,
      fontFamily: defaults.fontFamily,
      fontWeight: defaults.fontWeight,
      maxWidth: defaults.maxWidth,
      color: defaults.color,
      strokeEnabled: defaults.strokeEnabled,
      strokeColor: defaults.strokeColor,
      strokeWidth: defaults.strokeWidth,
      align: defaults.align,
      lineHeight: defaults.lineHeight,
      shadowEnabled: defaults.shadowEnabled,
      shadowColor: defaults.shadowColor,
      shadowBlur: defaults.shadowBlur,
      shadowOffsetX: defaults.shadowOffsetX,
      shadowOffsetY: defaults.shadowOffsetY,
      rotation: defaults.rotation,
    })
  }

  // --- Restart (needs confirmation from caller) ---
  function restart() {
    const newProject = createDefaultProject()
    project.backgroundSrc = newProject.backgroundSrc
    project.textLayers.splice(0, project.textLayers.length, ...newProject.textLayers)
    project.activeTextLayerId = newProject.activeTextLayerId
    ensureDefaults(project)
  }

  // --- Save / Load localStorage ---
  function saveToStorage() {
    try {
      const data = JSON.stringify({
        backgroundSrc: project.backgroundSrc,
        textLayers: project.textLayers,
        activeTextLayerId: project.activeTextLayerId,
      })
      localStorage.setItem(STORAGE_KEY, data)
    } catch {
      // Ignore quota errors or private browsing restrictions
    }
  }

  function loadFromStorage(): MemeProject | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const data = JSON.parse(raw) as MemeProject
      if (!data.textLayers || !Array.isArray(data.textLayers)) return null
      return data
    } catch {
      return null
    }
  }

  // --- Import / Export project data ---
  function exportProject(): string {
    return JSON.stringify({
      backgroundSrc: project.backgroundSrc,
      textLayers: project.textLayers,
      activeTextLayerId: project.activeTextLayerId,
    })
  }

  function importProject(json: string): boolean {
    try {
      const data = JSON.parse(json) as MemeProject
      if (!data.textLayers || !Array.isArray(data.textLayers)) return false
      project.backgroundSrc = data.backgroundSrc ?? ''
      project.textLayers.splice(0, project.textLayers.length, ...data.textLayers)
      project.activeTextLayerId = data.activeTextLayerId ?? project.textLayers[0]?.id ?? null
      return true
    } catch {
      return false
    }
  }

  // --- Auto-save with debounce 500ms ---
  watch(
    () => [
      project.backgroundSrc,
      project.textLayers.map((l) => ({ ...l })),
      project.activeTextLayerId,
    ],
    () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        saveToStorage()
      }, 500)
    },
    { deep: true },
  )

  return {
    project,
    activeTextLayer,
    setActiveTextLayerId,
    updateLayer,
    addTextLayer,
    removeTextLayer,
    applyClassicStyle,
    centerHorizontal,
    resetStyle,
    restart,
    exportProject,
    importProject,
  }
}
