<script lang="ts" setup>
import SvgIcon from '@/components/SvgIcon.vue'
import { HoldExecutor, keyboardOnly, mouseOnly } from '@/utils/HoldExecutor'
import { Utils } from '@/utils/MiscUtils'
import { MouseUtils } from '@/utils/MouseUtils'
import { IpcApp } from '@peiyanlu/electron/frontend'
import { Snackbar } from '@varlet/ui'
import { useEventListener, useMagicKeys } from '@vueuse/core'
import svgpath from 'svgpath'
import { ComponentPublicInstance, computed, onUpdated, ref, ShallowRef, useTemplateRef, watchEffect } from 'vue'


const props = defineProps<{ code: string, name: string }>()

const CANVAS_SIZE = 480
const SCALE_BASE = 1
const SCALE_FACTOR = 1.6
const STROKE_DASHARRAY = 10
const STROKE_WIDTH = 2.6
const PRECISION = 4

const canvasSize = ref(CANVAS_SIZE)
const scaleFactor = ref(SCALE_BASE)
const strokeDasharray = ref(STROKE_DASHARRAY)
const strokeWidth = ref(STROKE_WIDTH)

const sizeWithPx = computed(() => `${ canvasSize.value }px`)
const sliderVal = ref(16)
const gridSize = computed(() => canvasSize.value / sliderVal.value)
const useMouseKeyboard = ref(true)
const color = ref('')

const random = () => Math.random().toString(36).slice(2, 8)
const id0 = random()

const showDialog = ref<boolean>(false)
const selectedSvgPath = ref<SVGPathElement[]>([])

const vLineRef = useTemplateRef<SVGLineElement>('vLineRef')
const hLineRef = useTemplateRef<SVGLineElement>('hLineRef')
const lvLineRef = useTemplateRef<SVGLineElement>('lvLineRef')
const rvLineRef = useTemplateRef<SVGLineElement>('rvLineRef')
const thLineRef = useTemplateRef<SVGLineElement>('thLineRef')
const bhLineRef = useTemplateRef<SVGLineElement>('bhLineRef')

const mainRef = useTemplateRef<HTMLDivElement>('mainRef')
const svgRef = useTemplateRef<HTMLDivElement>('svgRef')


const resetCanvasSize = () => {
  canvasSize.value = CANVAS_SIZE
  scaleFactor.value = SCALE_BASE
}

const getViewBox = (code: string | SVGSVGElement) => {
  if (typeof code === 'string') {
    const viewBox = code.match(/(?<=viewBox=")([^>+].*?)(?=")/g)?.at(0)?.split(' ')
    return viewBox?.map(Number) ?? [ 0, 0, 1024, 1024 ]
  } else {
    const { x, y, width, height } = code.viewBox.baseVal
    return [ x, y, width, height ]
  }
}
const getVboxCenter = (code: string | SVGSVGElement) => {
  const [ _x, _y, width, height ] = getViewBox(code)
  return [ width * .5, height * .5 ]
}
const getUnionBBox = (targets: SVGGraphicsElement[]) => {
  let u = null as null | { x: number; y: number; width: number; height: number }
  targets.forEach(t => {
    const b = t.getBBox()
    if (!u) {
      u = { x: b.x, y: b.y, width: b.width, height: b.height }
    } else {
      const minX = Math.min(u.x, b.x)
      const minY = Math.min(u.y, b.y)
      const maxX = Math.max(u.x + u.width, b.x + b.width)
      const maxY = Math.max(u.y + u.height, b.y + b.height)
      u = { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    }
  })
  return u
}
const pxToViewBox = (px: number, canvasLen: number, boxLen: number) => (px / canvasLen) * boxLen
const getMouseSVGPoint = (svg: SVGSVGElement, evt: MouseEvent | WheelEvent) => {
  const pt = svg.createSVGPoint()
  Object.assign(pt, { x: evt.clientX, y: evt.clientY })
  const { x, y } = pt.matrixTransform(svg.getScreenCTM()?.inverse())
  return { x, y }
}
const getSvgMousePoint = (svg: SVGSVGElement, evt: MouseEvent | WheelEvent) => {
  const { left, top, width, height } = svg.getBoundingClientRect()
  const { x: vx, y: vy, width: vw, height: vh } = svg.viewBox.baseVal
  const [ offsetX, offsetY ] = [ evt.clientX - left, evt.clientY - top ]
  const x = offsetX / width * vw + vx
  const y = offsetY / height * vh + vy
  return { x, y }
}

onUpdated(() => {
  selectedSvgPath.value.forEach(child => child.removeAttribute('class'))
  selectedSvgPath.value = []
})

const handleShowDialog = (reset?: boolean) => {
  showDialog.value = !showDialog.value
  if (reset && typeof reset === 'boolean') {
    handleReset()
  }
}

const handleFocus = () => {
  IpcApp.send('element:focus', '.edit-container')
}

const getCode = (div: HTMLDivElement | null) => {
  if (!div) return ''
  const svg = div.querySelector('svg')!
  Array.from(svg.children).forEach(child => child.removeAttribute('class'))
  return Utils.toSelfClosing(div.innerHTML)
}

const getTargetList = () => {
  const [ _a, _b, width ] = getViewBox(props.code)
  strokeDasharray.value = width / 1024 * STROKE_DASHARRAY
  strokeWidth.value = width / 1024 * STROKE_WIDTH
  
  if (!selectedSvgPath.value.length) {
    if (svgRef.value) {
      const svg = svgRef.value.querySelector('svg')!
      selectedSvgPath.value = Array.from(svg.children) as SVGPathElement[]
    }
  }
  return selectedSvgPath.value
}

const handleSelect = (evt: MouseEvent) => {
  const target = evt.target as SVGPathElement
  
  const [ _a, _b, width ] = getViewBox(props.code)
  strokeDasharray.value = width / 1024 * STROKE_DASHARRAY
  strokeWidth.value = width / 1024 * STROKE_WIDTH
  
  const eleType = 'path|rect|circle|ellipse|line'.split('|')
  if (target && eleType.includes(target.tagName)) {
    if (evt.ctrlKey) {
      target.classList.add('selected')
      selectedSvgPath.value.push(target)
    } else {
      selectedSvgPath.value.map(t => t.classList.remove('selected'))
      if (selectedSvgPath.value.includes(target)) {
        selectedSvgPath.value = []
      } else {
        target.classList.add('selected')
        selectedSvgPath.value = [ target ]
      }
    }
  }
}

/* 放大 缩小 */
const handlePlus = (evt: MouseEvent) => {
  const svg: SVGSVGElement = svgRef.value?.querySelector('svg')!
  
  const targets = getTargetList()
  if (!targets.length) return
  
  const step = 1 / sliderVal.value
  let factor = 1 + step
  
  if (evt.shiftKey) {
    const union = getUnionBBox(targets)
    if (!union) return
    
    const { x, y, width, height } = union
    const [ , , vw, vh ] = getViewBox(svg)
    
    const stepX = vw / sliderVal.value
    const stepY = vh / sliderVal.value
    
    const fn = (d: number, s: number) => Math.max(1, (d + s * 2) / d)
    
    const factorX = fn(Math.min(width, vw), stepX)
    const factorY = fn(Math.min(height, vh), stepY)
    factor = Math.min(factorX, factorY)
    
    const EPS = 1e-2
    const maxW = vw + stepX + EPS
    const maxH = vh + stepY + EPS
    
    const nextWidth = width * factor
    const nextHeight = height * factor
    
    if (nextWidth > maxW || nextHeight > maxH) {
      return  // 放大到极限
    }
  }
  
  const [ centerX, centerY ] = evt.ctrlKey ? Object.values(getMouseSVGPoint(svg, evt)) : getVboxCenter(props.code)
  
  targets.forEach(target => {
    target.classList.add('selected')
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(-centerX, -centerY)
          .scale(factor, factor)
          .translate(centerX, centerY)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}
const handleMinus = (evt: MouseEvent) => {
  const svg: SVGSVGElement = svgRef.value?.querySelector('svg')!
  
  const targets = getTargetList()
  if (!targets.length) return
  
  const union = getUnionBBox(targets)
  if (!union) return
  
  const { x, y, width, height } = union
  const [ , , vw, vh ] = getViewBox(svg)
  
  const stepX = vw / sliderVal.value
  const stepY = vh / sliderVal.value
  
  if (Math.min(width, height) < 16) {
    return
  }
  
  const step = 1 / sliderVal.value
  let factor = 1 / (1 + step)
  
  if (evt.shiftKey) {
    const fn = (d: number, s: number) => Math.min(1, (d - s * 2) / d)
    
    const factorX = fn(Math.max(width, stepX * 2), stepX)
    const factorY = fn(Math.max(height, stepY * 2), stepY)
    factor = Math.max(factorX, factorY, 0)
    
    if (factor === 0) {
      return
    }
    
    const EPS = 1e-2
    const minW = stepX + EPS
    const minH = stepY + EPS
    
    const nextWidth = width * factor
    const nextHeight = height * factor
    
    if (nextWidth < minW || nextHeight < minH) {
      return // 缩小到极限
    }
  }
  
  const [ centerX, centerY ] = evt.ctrlKey ? Object.values(getMouseSVGPoint(svg, evt)) : getVboxCenter(props.code)
  
  targets.forEach(target => {
    target.classList.add('selected')
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(-centerX, -centerY)
          .scale(factor, factor)
          .translate(centerX, centerY)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}
const handleFitView = () => {
  const targets = getTargetList()
  if (!targets.length) return
  
  const union = getUnionBBox(targets)
  if (!union) return
  
  const { x, y, width, height } = union
  const [ , , vw, vh ] = getViewBox(props.code)
  targets.forEach(target => {
    target.classList.add('selected')
    
    // |<-- padding -->|<---   availW   --->|<-- padding -->|
    const pad = gridSize.value / scaleFactor.value
    const padding = pxToViewBox(pad, CANVAS_SIZE, vw)
    const availW = vw - padding * 2
    const availH = vh - padding * 2
    // 剩余空间内最大可放大比例
    const scale = Math.min(availW / width, availH / height)
    
    // 计算平移（确保居中）
    // 1) padding：基础偏移（避免贴边）
    // 2) -x * scale：将图标 BBox 左上角归一化到原点
    // 3) (availW - width * scale) / 2：计算居中所需的额外偏移
    const tx = padding - x * scale + (availW - width * scale) / 2
    const ty = padding - y * scale + (availH - height * scale) / 2
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .scale(scale)
          .translate(tx, ty)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}

/* 移动 */
const handleTop = () => {
  const [ _a, _b, _c, vh ] = getViewBox(props.code)
  const step = vh / sliderVal.value
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(0, -step)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}
const handleBottom = () => {
  const [ _a, _b, _c, vh ] = getViewBox(props.code)
  const step = vh / sliderVal.value
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(0, step)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}
const handleLeft = () => {
  const [ _a, _b, vw ] = getViewBox(props.code)
  const step = vw / sliderVal.value
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(-step, 0)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}
const handleRight = () => {
  const [ _a, _b, vw ] = getViewBox(props.code)
  const step = vw / sliderVal.value
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(step, 0)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}

/* 旋转 */
const handleRoteLeft = () => {
  const [ centerX, centerY ] = getVboxCenter(props.code)
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute('d', svgpath(d)
        .abs()
        .translate(-centerX, -centerY)
        .rotate(-45 / 2)
        .translate(centerX, centerY)
        .round(PRECISION)
        .toString(),
      )
    }
  })
}
const handleRoteRight = () => {
  getTargetList().forEach(target => {
    const [ centerX, centerY ] = getVboxCenter(props.code)
    target.classList.add('selected')
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute('d', svgpath(d)
        .abs()
        .translate(-centerX, -centerY)
        .rotate(45 / 2)
        .translate(centerX, centerY)
        .round(PRECISION)
        .toString(),
      )
    }
  })
}

/* 操作 */
const handleDownload = (str: string, name: string) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([ str ]))
  a.download = name
  a.click()
}
const handleCopy = (str: string) => {
  navigator.clipboard.writeText(str)
  Snackbar({
    content: '已复制',
    duration: 1000,
    type: 'success',
  })
}
const handleReset = () => {
  if (svgRef.value) {
    svgRef.value.innerHTML = props.code
    selectedSvgPath.value = []
  }
}
const handleDelete = () => {
  selectedSvgPath.value.forEach(el => el.remove())
}

/* 键鼠操作 */
const clearGuides = () => {
  [
    vLineRef,
    hLineRef,
    lvLineRef,
    rvLineRef,
    thLineRef,
    bhLineRef,
  ].forEach(dRef => {
    dRef.value && dRef.value.setAttribute('opacity', '0')
  })
}
useEventListener('mouseup', clearGuides)
const updateGuidesOnDrag = (dx: number, dy: number) => {
  const targets = getTargetList()
  if (!targets.length) return
  
  const union = getUnionBBox(targets)
  if (!union) return
  
  clearGuides()
  
  const [ , , vbWidth, vbHeight ] = getViewBox(props.code)
  
  const thresholdX = pxToViewBox(1, CANVAS_SIZE, vbWidth)
  const thresholdY = pxToViewBox(1, CANVAS_SIZE, vbHeight)
  // 画布中心
  const canvasCX = vbWidth * 0.5
  const canvasCY = vbHeight * 0.5
  
  // 元素原中心
  const elemCX = union.x + union.width * 0.5
  const elemCY = union.y + union.height * 0.5
  
  // 拖拽后的临时位置
  const tx = pxToViewBox(dx, CANVAS_SIZE, vbWidth)
  const ty = pxToViewBox(dy, CANVAS_SIZE, vbHeight)
  // 拖动后的目标位置（未吸附前）
  let nx = union.x + tx
  let ny = union.y + ty
  // 拖拽后中心
  let nxc = elemCX + tx
  let nyc = elemCY + ty
  
  const drawVLine = (line: SVGLineElement, x1x2: number) => {
    if (line) {
      line.setAttribute('x1', `${ x1x2 }%`)
      line.setAttribute('x2', `${ x1x2 }%`)
      line.setAttribute('opacity', '1')
    }
  }
  const drawHLine = (line: SVGLineElement, y1y2: number) => {
    if (line) {
      line.setAttribute('y1', `${ y1y2 }%`)
      line.setAttribute('y2', `${ y1y2 }%`)
      line.setAttribute('opacity', '1')
    }
  }
  
  // -------------------------
  // 居中吸附（基于拖动后位置）
  // -------------------------
  // 垂直居中
  if (Math.abs(nyc - canvasCY) <= thresholdY) {
    drawHLine(hLineRef.value!, canvasCY / vbHeight * 100)
    ny += (canvasCY - nyc)
  }
  
  // 水平居中
  if (Math.abs(nxc - canvasCX) <= thresholdX) {
    drawVLine(vLineRef.value!, canvasCX / vbWidth * 100)
    nx += (canvasCX - nxc)
  }
  
  // -------------------------
  // 边缘吸附（基于拖动后位置）
  // -------------------------
  // 左
  if (Math.abs(nx) <= thresholdX) {
    drawVLine(lvLineRef.value!, 0)
    nx = 0
  }
  
  // 右
  const rightGap = (nx + union.width) - vbWidth
  if (Math.abs(rightGap) <= thresholdX) {
    drawVLine(rvLineRef.value!, vbWidth / vbWidth * 100)
    nx = vbWidth - union.width
  }
  
  // 上
  if (Math.abs(ny) <= thresholdY) {
    drawHLine(thLineRef.value!, 0)
    ny = 0
  }
  
  // 下
  const bottomGap = (ny + union.height) - vbHeight
  if (Math.abs(bottomGap) <= thresholdY) {
    drawHLine(bhLineRef.value!, vbHeight / vbHeight * 100)
    ny = vbHeight - union.height
  }
  // --------------------------------------------------------------
  // finalDx / finalDy 的含义：元素最终应该移动的实际距离
  // --------------------------------------------------------------
  //
  // 假设：
  // union.x = 100               // 元素的原始位置（吸附前）
  // tx = 20                     // 鼠标拖动换算成 viewBox 后的移动量
  //
  // 经过拖动后，预计新位置：
  // nx = union.x + tx = 100 + 20 = 120
  //
  // 如果没有吸附，就会移动 20。
  // 但如果吸附发生，比如吸到 110：
  //
  // nx = 110                    // 吸附后修正的位置
  //
  // 那么最终实际应该移动的距离是：
  // finalDx = nx - union.x
  //         = 110 - 100
  //         = 10
  //
  // 也就是说：虽然鼠标拖动了 tx=20
  // 但由于吸附，元素最终只移动了 10。
  // --------------------------------------------------------------
  
  const [ finalDx, finalDy ] = [ nx - union.x, ny - union.y ].map(v => v / scaleFactor.value)
  
  return { finalDx, finalDy }
}
const handleDrag = (dx: number, dy: number) => {
  if (!useMouseKeyboard.value) {
    return
  }
  
  const { finalDx, finalDy } = updateGuidesOnDrag(dx, dy)!
  
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(finalDx, finalDy)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}
const handleWheel = (e: WheelEvent) => {
  if (!useMouseKeyboard.value) {
    return
  }
  
  e.deltaY > 0 ? handleMinus(e) : handlePlus(e)
}
const handleKeyup = (e: KeyboardEvent) => {
  if (!useMouseKeyboard.value) {
    return
  }
  
  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW':
      handleTop()
      break
    case 'ArrowDown':
    case 'KeyS':
      handleBottom()
      break
    case 'ArrowLeft':
    case 'KeyA':
      handleLeft()
      break
    case 'ArrowRight':
    case 'KeyD':
      handleRight()
      break
    case 'KeyQ':
      handleRoteLeft()
      break
    case 'KeyE':
      handleRoteRight()
      break
  }
}
const executor = new HoldExecutor(keyboardOnly(handleKeyup))
watchEffect(() => {
  if (svgRef.value) {
    executor.unbindKeyboardEvents(mainRef.value!)
    executor.bindKeyboardEvents(mainRef.value!)
    MouseUtils.dragDelta(svgRef.value, handleDrag)
  }
})

/* 颜色 */
const isValidColor = (strColor: string) => {
  const s = new Option().style
  s.color = strColor
  return !!s.color
}
const handleColor = () => {
  getTargetList().forEach(target => {
    if (isValidColor(color.value)) {
      target.setAttribute('fill', color.value)
    }
  })
}
const handleColorClear = () => {
  getTargetList().forEach(target => {
    if (target.classList.contains('selected')) {
      target.removeAttribute('fill')
    }
  })
}


const plusRef = useTemplateRef<ComponentPublicInstance>('plusRef')
const minusRef = useTemplateRef<ComponentPublicInstance>('minusRef')
const fitRef = useTemplateRef<ComponentPublicInstance>('fitRef')
const topRef = useTemplateRef<ComponentPublicInstance>('topRef')
const bottomRef = useTemplateRef<ComponentPublicInstance>('bottomRef')
const leftRef = useTemplateRef<ComponentPublicInstance>('leftRef')
const rightRef = useTemplateRef<ComponentPublicInstance>('rightRef')
const roteLeftRef = useTemplateRef<ComponentPublicInstance>('roteLeftRef')
const roteRightRef = useTemplateRef<ComponentPublicInstance>('roteRightRef')
const plusExecutor = new HoldExecutor(mouseOnly(handlePlus))
const minusExecutor = new HoldExecutor(mouseOnly(handleMinus))
const fitExecutor = new HoldExecutor(handleFitView)
const topExecutor = new HoldExecutor(handleTop)
const bottomExecutor = new HoldExecutor(handleBottom)
const leftExecutor = new HoldExecutor(handleLeft)
const rightExecutor = new HoldExecutor(handleRight)
const roteLeftExecutor = new HoldExecutor(handleRoteLeft)
const roteRightExecutor = new HoldExecutor(handleRoteRight)
watchEffect(() => {
  const extract = (xxRef: Readonly<ShallowRef<ComponentPublicInstance | null>>, executor: HoldExecutor) => {
    if (xxRef.value) {
      executor.unbindMouseEvents(xxRef.value.$el)
      executor.bindMouseEvents(xxRef.value.$el)
    }
  }
  extract(plusRef, plusExecutor)
  extract(minusRef, minusExecutor)
  extract(fitRef, fitExecutor)
  extract(topRef, topExecutor)
  extract(bottomRef, bottomExecutor)
  extract(leftRef, leftExecutor)
  extract(rightRef, rightExecutor)
  extract(roteLeftRef, roteLeftExecutor)
  extract(roteRightRef, roteRightExecutor)
})

/* 编辑区全屏 */
const handleFullScreen = async () => {
  const el = mainRef.value!
  
  if (document.fullscreenElement === el) {
    resetCanvasSize()
    await document.exitFullscreen()
    el.classList.remove('fullscreen-ready')
    return
  }
  
  el.classList.add('fullscreen-ready')
  
  await Promise.resolve()
  await el.requestFullscreen()
  
  scaleFactor.value = SCALE_FACTOR
  canvasSize.value *= SCALE_FACTOR
}
useEventListener(document, 'fullscreenchange', () => {
  if (document.fullscreenElement !== mainRef.value) {
    resetCanvasSize()
  }
})

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const { current } = useMagicKeys({ target: mainRef.value! })
const keys = computed(() => Array.from(current))


defineExpose({
  handleShowDialog,
})
</script>

<template>
  <div class="params-container">
    <div class="dialog-trigger" @click="handleShowDialog(false)">
      <svg-icon :name="code" html size="60px" />
    </div>
    
    <!---->
    <var-dialog
      lock-scroll
      v-model:show="showDialog"
      :dialog-style="{
        height: `${canvasSize + 40 + 45 + 60}px`,
        '--sizeWithPx': sizeWithPx
      }"
      dialog-class="edit-dialog"
      cancel-button-text="关闭"
      confirm-button-text="关闭并重置"
      confirm-button-text-color="var(--button-danger-color)"
      @confirm="handleShowDialog(true)"
      @cancel="handleShowDialog(false)"
      :close-on-click-overlay="false"
      :close-on-key-escape="true"
    >
      <template #title>
        <svg-icon name="ResEdit" size="20px" />
        <span>{{ name }}</span>
      </template>
      
      <div
        ref="mainRef"
        class="main"
        tabindex="0"
        @mouseenter="()=>mainRef?.focus()"
        @mouseleave="()=>mainRef?.blur()"
      >
        <div class="edit-container">
          <div :style="{width: sizeWithPx, height: sizeWithPx}" class="grid-background">
            <svg
              width="100%"
              height="100%"
              xmlns="http://www.w3.org/2000/svg"
              pointer-events="none"
            >
              <defs>
                <pattern
                  :id="id0"
                  :width="gridSize"
                  :height="gridSize"
                  patternUnits="userSpaceOnUse"
                  :x="-.25"
                  :y="-.25"
                >
                  <path
                    :d="`M ${gridSize} 0 H0 M0 0 V0 ${gridSize} z`"
                    stroke="rgba(var(--primary-color), .4)"
                    stroke-width="1"
                  />
                </pattern>
              </defs>
              <rect :fill="`url(#${id0})`" width="100%" height="100%" />
              <g stroke="rgba(255, 0, 0, .3)" stroke-width="1">
                <g v-if="sliderVal > 32">
                  <line x1="25%" x2="25%" y1="0%" y2="100%" />
                  <line x1="75%" x2="75%" y1="0%" y2="100%" />
                  <line x1="0%" x2="100%" y1="25%" y2="25%" />
                  <line x1="0%" x2="100%" y1="75%" y2="75%" />
                </g>
                <line x1="50%" x2="50%" y1="0%" y2="100%" />
                <line x1="0%" x2="100%" y1="50%" y2="50%" />
              </g>
            </svg>
            <svg
              class="guides"
              height="100%"
              width="100%"
              xmlns="http://www.w3.org/2000/svg"
              pointer-events="none"
              viewBox="0 0 1024 1024"
            >
              <g stroke="#00FF00" stroke-width="1" stroke-dasharray="12 4">
                <line ref="vLineRef" opacity="0" y1="0%" y2="100%" />
                <line ref="hLineRef" opacity="0" x1="0%" x2="100%" />
                
                <line ref="lvLineRef" stroke-width="2" opacity="0" y1="0%" y2="100%" />
                <line ref="rvLineRef" stroke-width="2" opacity="0" y1="0%" y2="100%" />
                
                <line ref="thLineRef" stroke-width="2" opacity="0" x1="0%" x2="100%" />
                <line ref="bhLineRef" stroke-width="2" opacity="0" x1="0%" x2="100%" />
              </g>
            </svg>
          </div>
          <div
            ref="svgRef"
            :style="{
              width: sizeWithPx,
              height: sizeWithPx,
              '--strokeDasharray': strokeDasharray,
              '--strokeWidth': strokeWidth,
            }"
            class="content"
            @click="handleSelect"
            v-html="code"
            @wheel="handleWheel($event)"
            @dblclick="handleFullScreen"
          />
        </div>
        
        <div :style="{width: '296px',height: sizeWithPx}" class="action-container">
          <div class="flex-row">
            <div class="title">网格</div>
            <var-slider
              v-model="sliderVal"
              :max="64"
              :min="4"
              :step="4"
            >
              <template #button="{ currentValue }">
                <div class="slider-example__block">{{ currentValue }}</div>
              </template>
            </var-slider>
          </div>
          
          <div class="flex-row">
            <div class="title">缩放</div>
            <div class="flex-row">
              <var-button ref="plusRef" round type="info">
                <svg-icon name="ResPlus" size="18px" />
              </var-button>
              <var-button ref="minusRef" round type="info">
                <svg-icon name="ResMinus" size="18px" />
              </var-button>
              <var-button ref="fitRef" round type="success">
                <svg-icon name="FullScreen" size="18px" />
              </var-button>
            </div>
          </div>
          
          <div class="flex-row">
            <div class="title">移动</div>
            <div class="flex-row">
              <var-button ref="topRef" round type="info">
                <svg-icon name="MoveTop" size="18px" />
              </var-button>
              <var-button ref="bottomRef" round type="info">
                <svg-icon name="MoveBottom" size="18px" />
              </var-button>
              <var-button ref="leftRef" round type="info">
                <svg-icon name="MoveLeft" size="18px" />
              </var-button>
              <var-button ref="rightRef" round type="info">
                <svg-icon name="MoveRight" size="18px" />
              </var-button>
            </div>
          </div>
          
          <div class="flex-row">
            <div class="title">旋转</div>
            <div class="flex-row">
              <var-button ref="roteLeftRef" round type="info">
                <svg-icon name="RotateLeft" size="18px" />
              </var-button>
              <var-button ref="roteRightRef" round type="info">
                <svg-icon name="RotateRight" size="18px" />
              </var-button>
            </div>
          </div>
          
          <div class="flex-row">
            <div class="title">操作</div>
            <div class="flex-row">
              <var-button round type="info" @click="handleDownload(getCode(svgRef), name)">
                <svg-icon name="download" size="18px" />
              </var-button>
              <var-button round type="info" @click="handleCopy(getCode(svgRef))">
                <svg-icon name="copy" size="18px" />
              </var-button>
              <var-button round type="warning" @click="handleReset">
                <svg-icon name="ResReset" size="18px" />
              </var-button>
              <var-button round type="danger" @click="handleDelete">
                <svg-icon name="delete" size="18px" />
              </var-button>
            </div>
          </div>
          
          <div class="flex-row">
            <div class="title">键鼠</div>
            <div class="flex-row">
              <var-switch v-model="useMouseKeyboard" />
            </div>
          </div>
          
          <div class="flex-row">
            <div class="title">颜色</div>
            <div class="flex-row">
              <var-input
                v-model="color"
                :hint="false"
                type="text"
                @keyup.enter="handleColor"
              />
              <var-button-group
                mode="icon-container"
                style="overflow: unset"
              >
                <var-button
                  :disabled="!isValidColor(color)"
                  round
                  type="success"
                  @click="handleColor"
                >
                  <svg-icon name="check" size="18px" />
                </var-button>
                <var-button
                  type="warning"
                  round
                  @click="handleColorClear"
                >
                  <svg-icon name="close" size="18px" />
                </var-button>
              </var-button-group>
            </div>
          </div>
        </div>
      </div>
      
      <template #actions="{slotClass, confirm, cancel}">
        <div :class="slotClass" style="gap: 12px">
          <div style="display: flex;align-items: center;gap: 4px;">
            <var-tooltip
              trigger="hover"
              color="rgba(var(--primary-background-color), 1)"
              placement="top-start"
            >
              <var-button round type="info" text>
                <svg-icon name="doc" size="20px" pointer />
              </var-button>
              <template #content>
                <div
                  style="
                    color: rgba(var(--primary-color), 1);
                    max-width: 450px;
                    word-break: break-all;
                    text-align: left;
                    display: flex;
                    flex-flow: column nowrap;
                    gap: 8px;
                 "
                >
                  <div>
                    缩放：按住 Ctrl 更改缩放中心为鼠标位置；按住 Shift 按网格大小缩放；点击
                    <svg-icon name="FullScreen" inline />
                    将 SVG 缩放到固定比例、提升 Shift 操作的精确度；
                  </div>
                  <div>移动：W 上移，A 左移，S 下移，D 右移；</div>
                  <div>旋转：Q 左旋转，E 右旋转；</div>
                  <div>全屏：双击画布全屏，再次操作退出；</div>
                </div>
              </template>
            </var-tooltip>
            
            <var-button @click="handleFocus" round type="info" text>
              <svg-icon name="focus" size="20px" />
            </var-button>
          </div>
          
          <div style="display: flex;flex: 1;align-items: center;gap: 4px;">
            <div style="display: flex;align-items: center;gap: 4px;">
              <var-chip
                v-for="key in keys"
                :key="key"
                size="small"
              >
                {{ cap(key) }}
              </var-chip>
            </div>
          </div>
          
          <div style="display: flex;gap: 8px">
            <var-button
              class="var-dialog__cancel-button"
              @click="cancel"
              type="primary"
              text
              :elevation="false"
            >
              关闭
            </var-button>
            <var-button
              class="var-dialog__confirm-button"
              text-color="var(--button-danger-color)"
              @click="confirm"
              text
              :elevation="false"
            >
              关闭并重置
            </var-button>
          </div>
        </div>
      </template>
    </var-dialog>
  </div>
</template>

<style scoped>
.params-container {
  &:focus {
    outline: none;
  }
  
  .dialog-trigger {
    width: 60px;
    height: 60px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 2px;
    cursor: pointer;
  }
}

</style>

<style>
.edit-dialog {
  width: 840px;
  user-select: none;
  --sizeWithPx: 480px;
  
  .var-dialog__title {
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
  }
  
  .var-dialog__message {
    height: calc(100% - 60px - 45px);
    
    .main {
      width: 792px;
      height: 480px;
      display: grid;
      grid-template-columns: var(--sizeWithPx) 296px;
      gap: 16px;
      grid-auto-flow: row dense;
      background: var(--dialog-background);
      place-content: center;
      place-items: center;
      transition: gap .25s ease-in, opacity 2s ease-in, width .25s ease, height .25s ease;
      will-change: width, height, gap, opacity;
      
      .edit-container {
        position: relative;
        
        .grid-background {
          .guides {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 2;
          }
        }
        
        .content {
          position: absolute;
          z-index: 1;
          top: 0;
          left: 0;
          --strokeDasharray: 30;
          --strokeWidth: 10;
          
          & > svg {
            overflow: hidden;
            width: 100%;
            height: 100%;
            vertical-align: middle;
            
            path {
              cursor: pointer;
              
              &.selected {
                stroke: #FF0000;
                stroke-dasharray: var(--strokeDasharray);
                stroke-width: var(--strokeWidth);
                stroke-linecap: round;
              }
            }
          }
        }
        
      }
      
      .action-container {
        display: flex;
        flex-flow: column nowrap;
        gap: 42px;
        
        .slider-example__block {
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          margin: 0 -12px;
          color: var(--button-info-text-color);
          border-radius: 50%;
          background-color: var(--button-info-color);
        }
        
        .flex-row {
          display: flex;
          align-items: center;
          flex-flow: row nowrap;
          justify-content: flex-start;
          gap: 24px;
          
          .title {
            flex-shrink: 0;
          }
          
          .var-input__input {
            font-size: 14px;
            height: 21px;
            text-align: center;
            
            &::placeholder {
              font-size: 12px;
            }
          }
        }
      }
      
      &.fullscreen-ready {
        gap: 48px;
        
        .flex-row {
          gap: 32px;
        }
      }
    }
  }
}
</style>
