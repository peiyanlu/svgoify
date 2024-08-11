<script lang="ts" setup>
import SvgIcon from '@/components/SvgIcon.vue'
import { Snackbar } from '@varlet/ui'
import svgpath from 'svgpath'
import { computed, ref } from 'vue'


const props = defineProps<{ code: string, name: string }>()

const CANVAS_SIZE = 480
const STROKE_DASHARRAY = 16
const STROKE_WIDTH = 4
const PRECISION = 4

const strokeDasharray = ref(STROKE_DASHARRAY)
const strokeWidth = ref(STROKE_WIDTH)

const sizeWithPx = CANVAS_SIZE + 'px'
const sliderVal = ref(16)
const gridSize = computed(() => CANVAS_SIZE / sliderVal.value)
const id = Math.random().toString(36).slice(2, 8)

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


const handleConfirm = () => {

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
    const s = (height ?? 1024) / sliderVal.value / 3
    
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
    const s = (height ?? 1024) / sliderVal.value / 3
    
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
    const s = (width ?? 1024) / sliderVal.value / 3
    
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
    const s = (width ?? 1024) / sliderVal.value / 3
    
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
</script>

<template>
  <div class="params-container" tabindex="0">
    <div class="dialog-trigger" @click="showDialog = true">
      <svg-icon :name="code" html size="52px" />
    </div>
    
    <!---->
    <var-dialog
      v-model:show="showDialog"
      :dialog-style="{
        height: `${CANVAS_SIZE + 40 + 45 + 60}px`,
        '--sizeWithPx': sizeWithPx
      }"
      dialog-class="edit-dialog"
      :confirmButton="false"
      @confirm="handleConfirm"
      cancel-button-text="关闭"
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
                  stroke="rgba(255,255,255,0.3)"
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
            <var-button round type="info" @click="handlePlus">
              <svg-icon name="ResPlus" size="20px" />
            </var-button>
            <var-button round type="info" @click="handleMinus">
              <svg-icon name="ResMinus" size="20px" />
            </var-button>
          </div>
        </div>
        
        <div class="flex-row">
          <div>移动</div>
          <div class="flex-row">
            <var-button round type="info" @click="handleTop">
              <svg-icon name="MoveTop" size="20px" />
            </var-button>
            <var-button round type="info" @click="handleBottom">
              <svg-icon name="MoveBottom" size="20px" />
            </var-button>
            <var-button round type="info" @click="handleLeft">
              <svg-icon name="MoveLeft" size="20px" />
            </var-button>
            <var-button round type="info" @click="handleRight">
              <svg-icon name="MoveRight" size="20px" />
            </var-button>
          </div>
        </div>
        
        <div class="flex-row">
          <div>旋转</div>
          <div class="flex-row">
            <var-button round type="info" @click="handleRoteLeft">
              <svg-icon name="RotateLeft" size="20px" />
            </var-button>
            <var-button round type="info" @click="handleRoteRight">
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
      </div>
    </var-dialog>
  </div>
</template>

<style scoped>
.params-container {
  
  .dialog-trigger {
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
              stroke: #E01313;
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
      gap: 44px;
      
      .slider-example__block {
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        margin: 0 -12px;
        color: #000000;
        border-radius: 50%;
        background-color: var(--slider-track-fill-background);
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
      }
    }
  }
}
</style>
