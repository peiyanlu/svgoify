<script lang="ts" setup>
import SvgIcon from '@/components/SvgIcon.vue'
import { HoldExecutor } from '@/utils/HoldExecutor'
import { MouseUtils } from '@/utils/MouseUtils'
import { Snackbar } from '@varlet/ui'
import { useEventListener } from '@vueuse/core'
import svgpath from 'svgpath'
import { ComponentPublicInstance, computed, Ref, ref, useTemplateRef, watchEffect } from 'vue'


const props = defineProps<{ code: string, name: string }>()

const CANVAS_SIZE = 480
const SCALE_FACTOR = 1.6
const STROKE_DASHARRAY = 10
const STROKE_WIDTH = 2.6
const PRECISION = 4

const canvasSize = ref(CANVAS_SIZE)
const scaleFactor = ref(1)
const strokeDasharray = ref(STROKE_DASHARRAY)
const strokeWidth = ref(STROKE_WIDTH)

const sizeWithPx = computed(() => canvasSize.value + 'px')
const sliderVal = ref(16)
const gridSize = computed(() => canvasSize.value / sliderVal.value)
const id = Math.random().toString(36).slice(2, 8)
const useMouseKeyboard = ref(true)
const color = ref('')

const showDialog = ref<boolean>(false)
const selectedSvgPath = ref<SVGPathElement[]>([])
const svgRef = useTemplateRef<HTMLDivElement>('svgRef')
const vLineRef = useTemplateRef<SVGLineElement>('vLineRef')
const hLineRef = useTemplateRef<SVGLineElement>('hLineRef')
const lvLineRef = useTemplateRef<SVGLineElement>('lvLineRef')
const rvLineRef = useTemplateRef<SVGLineElement>('rvLineRef')
const thLineRef = useTemplateRef<SVGLineElement>('thLineRef')
const bhLineRef = useTemplateRef<SVGLineElement>('bhLineRef')

const resetCanvasSize = () => {
  canvasSize.value = CANVAS_SIZE
  scaleFactor.value = SCALE_FACTOR
}

const getViewBox = (code: string) => {
  const viewBox = code.match(/(?<=viewBox=")([^>+].*?)(?=")/g)?.at(0)?.split(' ')
  return viewBox?.map(Number) ?? [ 0, 0, 1024, 1024 ]
}
const getBboxCenter = (code: string) => {
  const [ _x, _y, width, height ] = getViewBox(code)
  return [ width * .5, height * .5 ]
}
const getCode = (div: HTMLDivElement | null) => {
  if (!div) return ''
  const svg = div.querySelector('svg')!
  svg.hasAttribute('class')
  Array.from(svg.children).forEach(child => {
    if (child.hasAttribute('class')) {
      child.removeAttribute('class')
    }
  })
  return div.innerHTML.replace(/><\/(path|rect|circle|ellipse|line)>/, '/>')
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

const handleShowDialog = (reset?: boolean) => {
  showDialog.value = !showDialog.value
  if (reset && typeof reset === 'boolean') {
    handleReset()
  }
}

const handleClick = (evt: MouseEvent) => {
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
const handlePlus = () => {
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const [ centerX, centerY ] = getBboxCenter(props.code)
    const factor = 1 + 1 / sliderVal.value
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(-centerX, -centerY)
          .scale(factor)
          .translate(centerX, centerY)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}
const handleMinus = () => {
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const [ centerX, centerY ] = getBboxCenter(props.code)
    const factor = 1 - 1 / sliderVal.value
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(-centerX, -centerY)
          .scale(factor)
          .translate(centerX, centerY)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}

/* 移动 */
const handleTop = () => {
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const [ _a, _b, _c, height ] = getViewBox(props.code)
    const s = (height ?? 1024) / sliderVal.value
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(0, -s)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}
const handleBottom = () => {
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const [ _a, _b, _c, height ] = getViewBox(props.code)
    const s = (height ?? 1024) / sliderVal.value
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(0, s)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}
const handleLeft = () => {
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const [ _a, _b, width ] = getViewBox(props.code)
    const s = (width ?? 1024) / sliderVal.value
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(-s, 0)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}
const handleRight = () => {
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const [ _a, _b, width ] = getViewBox(props.code)
    const s = (width ?? 1024) / sliderVal.value
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(s, 0)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}

/* 旋转 */
const handleRoteLeft = () => {
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const [ centerX, centerY ] = getBboxCenter(props.code)
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute('d', svgpath(d)
        .abs()
        .translate(-centerX, -centerY)
        .rotate(-45)
        .translate(centerX, centerY)
        .round(PRECISION)
        .toString(),
      )
    }
  })
}
const handleRoteRight = () => {
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const [ centerX, centerY ] = getBboxCenter(props.code)
    
    const d = target.getAttribute('d')
    if (d) {
      target.setAttribute('d', svgpath(d)
        .abs()
        .translate(-centerX, -centerY)
        .rotate(45)
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
const handleWheel = (e: WheelEvent) => {
  if (!useMouseKeyboard.value) {
    return
  }
  
  e.deltaY > 0 ? handleMinus() : handlePlus()
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
  
  clearGuides()
  
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
  const union = getUnionBBox(targets)
  if (!union) return
  
  const [ , , vbWidth, vbHeight ] = getViewBox(props.code)
  const pxToViewBox = (px: number, vbLen: number) => ((px * scaleFactor.value) / canvasSize.value) * vbLen
  
  const [ thresholdX, thresholdY ] = Array(2).fill(pxToViewBox(1, vbHeight))
  // 画布中心
  const canvasCX = vbWidth * 0.5
  const canvasCY = vbHeight * 0.5
  
  // 元素原中心
  const elemCX = union.x + union.width * 0.5
  const elemCY = union.y + union.height * 0.5
  
  // 拖拽后的临时位置
  const tx = pxToViewBox(dx, vbWidth)
  const ty = pxToViewBox(dy, vbHeight)
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
    drawHLine(hLineRef.value, canvasCY / vbHeight * 100)
    ny += (canvasCY - nyc)
  }
  
  // 水平居中
  if (Math.abs(nxc - canvasCX) <= thresholdX) {
    drawVLine(vLineRef.value, canvasCX / vbWidth * 100)
    nx += (canvasCX - nxc)
  }
  
  // -------------------------
  // 边缘吸附（基于拖动后位置）
  // -------------------------
  // 左
  if (Math.abs(nx) <= thresholdX) {
    drawVLine(lvLineRef.value, 0)
    nx = 0
  }
  
  // 右
  const rightGap = (nx + union.width) - vbWidth
  if (Math.abs(rightGap) <= thresholdX) {
    drawVLine(rvLineRef.value, vbWidth / vbWidth * 100)
    nx = vbWidth - union.width
  }
  
  // 上
  if (Math.abs(ny) <= thresholdY) {
    drawHLine(thLineRef.value, 0)
    ny = 0
  }
  
  // 下
  const bottomGap = (ny + union.height) - vbHeight
  if (Math.abs(bottomGap) <= thresholdY) {
    drawHLine(bhLineRef.value, vbHeight / vbHeight * 100)
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
  
  const { finalDx, finalDy } = updateGuidesOnDrag(dx, dy)
  
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
const executor = new HoldExecutor(handleKeyup)
watchEffect(() => {
  if (svgRef.value) {
    executor.unbindKeyboardEvents(svgRef.value)
    executor.bindKeyboardEvents(svgRef.value)
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
const topRef = useTemplateRef<ComponentPublicInstance>('topRef')
const bottomRef = useTemplateRef<ComponentPublicInstance>('bottomRef')
const leftRef = useTemplateRef<ComponentPublicInstance>('leftRef')
const rightRef = useTemplateRef<ComponentPublicInstance>('rightRef')
const roteLeftRef = useTemplateRef<ComponentPublicInstance>('roteLeftRef')
const roteRightRef = useTemplateRef<ComponentPublicInstance>('roteRightRef')
const plusExecutor = new HoldExecutor(handlePlus)
const minusExecutor = new HoldExecutor(handleMinus)
const topExecutor = new HoldExecutor(handleTop)
const bottomExecutor = new HoldExecutor(handleBottom)
const leftExecutor = new HoldExecutor(handleLeft)
const rightExecutor = new HoldExecutor(handleRight)
const roteLeftExecutor = new HoldExecutor(handleRoteLeft)
const roteRightExecutor = new HoldExecutor(handleRoteRight)
watchEffect(() => {
  const extract = (xxRef: Ref<ComponentPublicInstance>, executor: HoldExecutor) => {
    if (xxRef.value) {
      executor.unbindMouseEvents(xxRef.value.$el)
      executor.bindMouseEvents(xxRef.value.$el)
    }
  }
  extract(plusRef, plusExecutor)
  extract(minusRef, minusExecutor)
  extract(topRef, topExecutor)
  extract(bottomRef, bottomExecutor)
  extract(leftRef, leftExecutor)
  extract(rightRef, rightExecutor)
  extract(roteLeftRef, roteLeftExecutor)
  extract(roteRightRef, roteRightExecutor)
})

/* 编辑区全屏 */
const mainRef = useTemplateRef<HTMLDivElement>('mainRef')
const handleFullScreen = async () => {
  const el = mainRef.value
  
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
  canvasSize.value = canvasSize.value * scaleFactor.value
}
useEventListener(document, 'fullscreenchange', () => {
  if (document.fullscreenElement !== mainRef.value) {
    resetCanvasSize()
  }
})

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
      
      <div ref="mainRef" class="main">
        <div :style="{width: sizeWithPx, height: sizeWithPx}" class="edit-container">
          <div :style="{width: sizeWithPx, height: sizeWithPx}" class="grid-background">
            <svg
              height="100%"
              width="100%"
              xmlns="http://www.w3.org/2000/svg"
              pointer-events="none"
            >
              <defs>
                <pattern
                  :id="id"
                  :height="gridSize"
                  :width="gridSize"
                  patternUnits="userSpaceOnUse"
                  x="-0.25"
                  y="-0.25"
                >
                  <path
                    :d="`M ${gridSize} 0 H0 M0 0 V0 ${gridSize} z`"
                    stroke="rgba(var(--primary-color), .4)"
                    stroke-width="1"
                  />
                </pattern>
              </defs>
              <rect :fill="`url(#${id})`" height="100%" width="100%" />
            </svg>
            <svg
              class="guides"
              height="100%"
              width="100%"
              xmlns="http://www.w3.org/2000/svg"
              pointer-events="none"
            >
              <g stroke="#BCCE8A" stroke-width="1" stroke-dasharray="4 2">
                <line ref="vLineRef" opacity="0" y1="0%" y2="100%" />
                <line ref="hLineRef" opacity="0" x1="0%" x2="100%" />
                
                <line ref="lvLineRef" opacity="0" y1="0%" y2="100%" />
                <line ref="rvLineRef" opacity="0" y1="0%" y2="100%" />
                
                <line ref="thLineRef" opacity="0" x1="0%" x2="100%" />
                <line ref="bhLineRef" opacity="0" x1="0%" x2="100%" />
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
            @click="handleClick"
            v-html="code"
            @wheel="handleWheel($event)"
            tabindex="0"
            @mouseenter="()=>svgRef.focus()"
            @mouseleave="()=>svgRef.blur()"
            @dblclick="handleFullScreen"
          />
        </div>
        
        <div :style="{width: '296px',height: sizeWithPx}" class="action-container">
          <div class="flex-row">
            <div class="title">网格</div>
            <var-slider
              v-model="sliderVal"
              :max="128"
              :min="8"
              :step="8"
              style="padding-right: 10px;"
            >
              <template #button="{ currentValue }">
                <div class="slider-example__block">{{ currentValue }}</div>
              </template>
            </var-slider>
          </div>
          
          <div class="flex-row">
            <div class="title">大小</div>
            <div class="flex-row">
              <var-button ref="plusRef" round type="info">
                <svg-icon name="ResPlus" size="20px" />
              </var-button>
              <var-button ref="minusRef" round type="info">
                <svg-icon name="ResMinus" size="20px" />
              </var-button>
            </div>
          </div>
          
          <div class="flex-row">
            <div class="title">移动</div>
            <div class="flex-row">
              <var-button ref="topRef" round type="info">
                <svg-icon name="MoveTop" size="20px" />
              </var-button>
              <var-button ref="bottomRef" round type="info">
                <svg-icon name="MoveBottom" size="20px" />
              </var-button>
              <var-button ref="leftRef" round type="info">
                <svg-icon name="MoveLeft" size="20px" />
              </var-button>
              <var-button ref="rightRef" round type="info">
                <svg-icon name="MoveRight" size="20px" />
              </var-button>
            </div>
          </div>
          
          <div class="flex-row">
            <div class="title">旋转</div>
            <div class="flex-row">
              <var-button ref="roteLeftRef" round type="info">
                <svg-icon name="RotateLeft" size="20px" />
              </var-button>
              <var-button ref="roteRightRef" round type="info">
                <svg-icon name="RotateRight" size="20px" />
              </var-button>
            </div>
          </div>
          
          <div class="flex-row">
            <div class="title">操作</div>
            <div class="flex-row">
              <var-button round type="info" @click="handleDownload(getCode(svgRef), name)">
                <svg-icon name="download" size="20px" />
              </var-button>
              <var-button round type="info" @click="handleCopy(getCode(svgRef))">
                <svg-icon name="copy" size="20px" />
              </var-button>
              <var-button round type="warning" @click="handleReset">
                <svg-icon name="ResReset" size="20px" />
              </var-button>
              <var-button round type="danger" @click="handleDelete">
                <svg-icon name="delete" size="20px" />
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
                  <svg-icon name="check" size="20px" />
                </var-button>
                <var-button
                  type="warning"
                  round
                  @click="handleColorClear"
                >
                  <var-icon name="close-circle" size="20px" />
                </var-button>
              </var-button-group>
            </div>
          </div>
        </div>
      </div>
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
