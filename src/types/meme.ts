export type TextLayer = {
  id: string
  text: string
  x: number
  y: number
  maxWidth: number
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'bold' | 'extra-bold'
  color: string
  strokeEnabled: boolean
  strokeColor: string
  strokeWidth: number
  align: 'left' | 'center' | 'right'
  lineHeight: number
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  rotation: number
}

export type MemeProject = {
  backgroundSrc: string
  textLayers: TextLayer[]
  activeTextLayerId: string | null
}

export type RenderOptions = {
  scale: number
  showGuides: boolean
}
