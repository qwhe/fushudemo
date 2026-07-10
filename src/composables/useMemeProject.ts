import { ref, reactive, watch, computed } from 'vue'
import type { MemeProject, TextLayer } from '../types/meme'

const STORAGE_KEY = 'opossum-meme-project'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function defaultTextLayer(): TextLayer {
  return {
    id: generateId(),
    text: '',
    x: 0,
    y: 0,
    maxWidth: 800,
    fontSize: 48,
    fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    fontWeight: 'normal',
    color: '#ffffff',
    strokeEnabled: false,
    strokeColor: '#000000',
    strokeWidth: 3,
    align: 'center',
    lineHeight: 1.3,
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

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function useMemeProject() {
  const project = reactive<MemeProject>(loadFromStorage() ?? createDefaultProject())

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
      fontSize: 48,
      fontWeight: 'bold',
      color: '#ffffff',
      strokeEnabled: true,
      strokeColor: '#000000',
      strokeWidth: 4,
      align: 'center',
      lineHeight: 1.3,
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
      fontWeight: defaults.fontWeight,
      color: defaults.color,
      strokeEnabled: defaults.strokeEnabled,
      strokeColor: defaults.strokeColor,
      strokeWidth: defaults.strokeWidth,
      align: defaults.align,
      lineHeight: defaults.lineHeight,
    })
  }

  // --- Restart (needs confirmation from caller) ---
  function restart() {
    const newProject = createDefaultProject()
    project.backgroundSrc = newProject.backgroundSrc
    project.textLayers.splice(0, project.textLayers.length, ...newProject.textLayers)
    project.activeTextLayerId = newProject.activeTextLayerId
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
