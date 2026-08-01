import { svgPathBbox } from 'svg-path-bbox'


export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Transform {
  scale: number;
  tx: number;
  ty: number;
}

export type VwVh = [ vw: number, vh: number ]

export type ViewBox = [ x: number, y: number, width: number, height: number ]


export const pxToViewBox = (px: number, canvasLen: number, boxLen: number): number => (px / canvasLen) * boxLen

export const calcFitTransform = (bbox: BBox, viewBox: VwVh, percentage: number = .125): Transform => {
  const { x, y, width, height } = bbox
  const [ vw, vh ] = viewBox
  
  const prt = Math.max(0, Math.min(1, percentage))
  const padding = pxToViewBox(480 * prt, 480, vw)
  
  // |<-- padding -->|<---   availW   --->|<-- padding -->|
  
  const availW = vw - padding * 2
  const availH = vh - padding * 2
  
  const scale = Math.min(availW / width, availH / height)
  
  const scaledWidth = width * scale
  const scaledHeight = height * scale
  
  const offsetX = (availW - scaledWidth) / 2
  const offsetY = (availH - scaledHeight) / 2
  
  const currentX = x * scale
  const currentY = y * scale
  
  const targetX = padding + offsetX
  const targetY = padding + offsetY
  
  const tx = targetX - currentX
  const ty = targetY - currentY
  
  return { scale, tx, ty }
}

export const getBBox = (paths: string[]): BBox => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  
  for (const d of paths) {
    const [ x1, y1, x2, y2 ] = svgPathBbox(d)
    
    minX = Math.min(minX, x1)
    minY = Math.min(minY, y1)
    maxX = Math.max(maxX, x2)
    maxY = Math.max(maxY, y2)
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export const parseViewBox = (viewBox: string): ViewBox => {
  return viewBox.split(/[\s,]+/).map(Number) as ViewBox
}

export const getViewBox = (svgCode: string): ViewBox => {
  const reg = /(?<=viewBox=["'])([^"']*)(?=["'])/g
  const viewBox = svgCode.match(reg)?.at(0)
  if (!viewBox) throw new Error('svgCode has no viewBox')
  return parseViewBox(viewBox)
}

export const getViewBoxCenter = (viewBox: ViewBox) => {
  const [ _x, _y, width, height ] = viewBox
  return [ width * .5, height * .5 ]
}
