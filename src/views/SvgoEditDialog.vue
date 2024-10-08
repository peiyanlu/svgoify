<script lang="ts" setup>
import SvgIcon from '@/components/SvgIcon.vue'
import { HoldExecutor } from '@/utils/HoldExecutor'
import { MouseUtils } from '@/utils/MouseUtils'
import { Snackbar } from '@varlet/ui'
import svgpath from 'svgpath'
import { ComponentPublicInstance, computed, onBeforeMount, onMounted, Ref, ref, watchEffect } from 'vue'


const props = defineProps<{ code: string, name: string }>()

const CANVAS_SIZE = 480
const STROKE_DASHARRAY = 10
const STROKE_WIDTH = 2
const PRECISION = 4

const strokeDasharray = ref(STROKE_DASHARRAY)
const strokeWidth = ref(STROKE_WIDTH)

const sizeWithPx = CANVAS_SIZE + 'px'
const sliderVal = ref(16)
const gridSize = computed(() => CANVAS_SIZE / sliderVal.value)
const id = Math.random().toString(36).slice(2, 8)
const useMouseKeyboard = ref(true)
const color = ref('')

const showDialog = ref<boolean>(false)
const selectedSvgPath = ref<SVGPathElement[]>([])
const svgRef = ref<HTMLDivElement | null>(null)

const getViewBox = (code: string) => {
  const viewBox = code.match(/(?<=viewBox=")([^>+].*?)(?=")/g)?.at(0)?.split(' ')
  return viewBox?.map(Number) ?? [ 0, 0, 1024, 1024 ]
}
const getOffset = (code: string) => {
  const [ _x, _y, width, height ] = getViewBox(code)
  const offsetX = width / 2
  const offsetY = height / 2
  
  return [ offsetX, offsetY ]
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

const handleShowDialog = () => {
  showDialog.value = true
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
    
    const [ offsetX, offsetY ] = getOffset(props.code)
    const d = target.getAttribute('d')
    const factor = 1 + 1 / sliderVal.value
    
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(-offsetX, -offsetY)
          .scale(factor)
          .translate(offsetX, offsetY)
          .round(PRECISION)
          .toString(),
      )
    }
  })
}
const handleMinus = () => {
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const [ offsetX, offsetY ] = getOffset(props.code)
    const d = target.getAttribute('d')
    const factor = 1 - 1 / sliderVal.value
    
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(-offsetX, -offsetY)
          .scale(factor)
          .translate(offsetX, offsetY)
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
    const d = target.getAttribute('d')
    const s = (height ?? 1024) / sliderVal.value
    
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
    const d = target.getAttribute('d')
    const s = (height ?? 1024) / sliderVal.value
    
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
    const d = target.getAttribute('d')
    const s = (width ?? 1024) / sliderVal.value
    
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
    const d = target.getAttribute('d')
    const s = (width ?? 1024) / sliderVal.value
    
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
    
    const [ offsetX, offsetY ] = getOffset(props.code)
    const d = target.getAttribute('d')
    
    if (d) {
      target.setAttribute('d', svgpath(d)
        .abs()
        .translate(-offsetX, -offsetY)
        .rotate(-45)
        .translate(offsetX, offsetY)
        .round(PRECISION)
        .toString(),
      )
    }
  })
}
const handleRoteRight = () => {
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const [ offsetX, offsetY ] = getOffset(props.code)
    const d = target.getAttribute('d')
    
    if (d) {
      target.setAttribute('d', svgpath(d)
        .abs()
        .translate(-offsetX, -offsetY)
        .rotate(45)
        .translate(offsetX, offsetY)
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
const handleDrag = (dx: number, dy: number) => {
  if (!useMouseKeyboard.value) {
    return
  }
  
  getTargetList().forEach(target => {
    target.classList.add('selected')
    
    const [ _a, _b, width, height ] = getViewBox(props.code)
    const d = target.getAttribute('d')
    
    if (d) {
      target.setAttribute(
        'd',
        svgpath(d)
          .abs()
          .translate(dx / CANVAS_SIZE * width, dy / CANVAS_SIZE * height)
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
onBeforeMount(() => {
  if (svgRef.value) {
    executor.unbindKeyboardEvents(svgRef.value)
  }
})

/* 颜色 */
const handleColor = () => {
  const isValidColor = (strColor: string) => {
    const s = new Option().style
    s.color = strColor
    return !!s.color
  }
  
  getTargetList().forEach(target => {
    console.log(isValidColor(color.value))
    if (isValidColor(color.value)) {
      target.setAttribute('fill', color.value)
    }
  })
}
const handleColorClear = () => {
  getTargetList().forEach(target => {
    target.removeAttribute('fill')
  })
}


const plusRef = ref<ComponentPublicInstance | null>(null)
const minusRef = ref<ComponentPublicInstance | null>(null)
const topRef = ref<ComponentPublicInstance | null>(null)
const bottomRef = ref<ComponentPublicInstance | null>(null)
const leftRef = ref<ComponentPublicInstance | null>(null)
const rightRef = ref<ComponentPublicInstance | null>(null)
const roteLeftRef = ref<ComponentPublicInstance | null>(null)
const roteRightRef = ref<ComponentPublicInstance | null>(null)
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


defineExpose({
  handleShowDialog,
})
</script>

<template>
  <div class="params-container">
    <div class="dialog-trigger" @click="handleShowDialog">
      <svg-icon :name="code" html size="60px" />
    </div>
    
    <!---->
    <var-dialog
      lock-scroll
      v-model:show="showDialog"
      :dialog-style="{
        height: `${CANVAS_SIZE + 40 + 45 + 60}px`,
        '--sizeWithPx': sizeWithPx
      }"
      dialog-class="edit-dialog"
      :confirmButton="false"
      cancel-button-text="关闭"
      :close-on-click-overlay="false"
    >
      <template #title>
        <svg-icon name="ResEdit" size="20px" />
        <span>{{ name }}</span>
      </template>
      
      <div class="edit-container">
        <div :style="{width: sizeWithPx, height: sizeWithPx}" class="grid-background">
          <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
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
        />
      </div>
      
      <div class="action-container">
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
          <div>大小</div>
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
          <div>移动</div>
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
          <div>旋转</div>
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
          <div>操作</div>
          <div class="flex-row">
            <var-button round type="info" @click="handleDownload(getCode(svgRef), name)">
              <svg-icon name="download" size="20px" />
            </var-button>
            <var-button round type="info" @click="handleCopy(getCode(svgRef))">
              <svg-icon name="copy" size="20px" />
            </var-button>
            <var-button round type="danger" @click="handleReset">
              <svg-icon name="ResReset" size="20px" />
            </var-button>
          </div>
        </div>
        
        <div class="flex-row">
          <div>键鼠</div>
          <div class="flex-row">
            <var-switch v-model="useMouseKeyboard" />
          </div>
        </div>
        
        <div class="flex-row">
          <div>颜色</div>
          <div class="flex-row">
            <var-input
              v-model="color"
              :hint="false"
              type="text"
              @blur="handleColor"
              @keyup.enter="handleColor"
              clearable
              @clear="handleColorClear"
            />
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
  --sizeWithPx: 500px;
  
  .var-dialog__title {
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
  }
  
  .var-dialog__message {
    display: grid;
    overflow: auto;
    height: calc(100% - 60px - 45px);
    grid-template-columns: var(--sizeWithPx) minmax(260px, 1fr);
    gap: 16px;
    grid-auto-flow: row dense;
    
    .edit-container {
      position: relative;
      
      .grid-background {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        
        &::after {
          position: absolute;
          top: 0;
          left: calc(50% - 5px / 2);
          width: 5px;
          height: 100%;
          content: "";
          transform: scaleX(0.2);
          transform-origin: center;
          background: #D14748;
        }
        
        &::before {
          position: absolute;
          top: calc(50% - 5px / 2);
          left: 0;
          width: 100%;
          height: 5px;
          content: "";
          transform: scaleY(0.2);
          transform-origin: center;
          background: #D14748;
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
              stroke: #FF001C;
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
        gap: calc(var(--sizeWithPx) * 0.2 / 4);
        
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
  }
}
</style>
