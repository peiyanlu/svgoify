<script lang="ts" setup>
import HighlightJs from '@/views/HighlightCode.vue'
import { computed, ref } from 'vue'


const props = withDefaults(
  defineProps<{
    title: string
    code: string
    type: 'symbol' | 'clipPath' | 'cssVar',
    width?: number | string
    height?: number | string
  }>(),
  {
    width: 36,
    height: 36,
  },
)

const w = computed(() => props.width + 'px')
const h = computed(() => props.height + 'px')
const isCssVar = computed(() => props.type === 'cssVar')

const showDialog = ref<boolean>(false)

const html = computed(() => {
  let domparser = new DOMParser()
  
  if (props.type === 'clipPath') {
    const codeFormat = domparser.parseFromString(props.code, 'image/svg+xml')
    console.log(codeFormat)
    return Array
      .from(codeFormat.querySelectorAll('clipPath'))
      .map(node => {
        const id = node.getAttribute('id')
        return `<div title="${ id }"><i class="clipPath-icon" style="--clipPath:url(#${ id })"></i></div>`
      })
      .join('\n')
  }
  
  if (props.type === 'symbol') {
    const codeFormat = domparser.parseFromString(props.code, 'image/svg+xml')
    
    return Array
      .from(codeFormat.querySelectorAll('symbol'))
      .map(node => {
        const id = node.getAttribute('id')
        return `<div title="${ id }"><svg class="symbol-icon"><use href="#${ id }" /></svg></div>`
      })
      .join('\n')
  }
  
  if (props.type === 'cssVar') {
    return props.code.match(/--(.*?)(?=:)/g)
      ?.map(id => {
        return `<div title="${ id }"><i class="cssVar-icon" style="background-image: var(${ id })"></i></div>`
      })
      .join('\n')
  }
})

const empty = '\u00A0'
const style = computed(() => {
  return props.type === 'clipPath'
    ? `.clipPath-icon {
      ${ empty.repeat(2) }display: inline-block;
      ${ empty.repeat(2) }width: var(--width);
      ${ empty.repeat(2) }height: var(--height);
      ${ empty.repeat(2) }border-radius: 4px;
      ${ empty.repeat(2) }background: linear-gradient(deepskyblue, deeppink);
      ${ empty.repeat(2) }--width: ${ Number(props.width) }px;
      ${ empty.repeat(2) }--height: ${ Number(props.height) }px;
      ${ empty.repeat(2) }clip-path: var(--clipPath);
    }
    `
    : props.type === 'symbol'
      ? `.symbol-icon {
        ${ empty.repeat(2) }display: inline-block;
        ${ empty.repeat(2) }width: var(--width);
        ${ empty.repeat(2) }height: var(--height);
        ${ empty.repeat(2) }color: var(--color-primary);
        ${ empty.repeat(2) }fill: currentColor;
        ${ empty.repeat(2) }border-radius: 4px;
        ${ empty.repeat(2) }--width: ${ Number(props.width) }px;
        ${ empty.repeat(2) }--height: ${ Number(props.height) }px;
      }
      `
      : `.cssVar-icon {
        ${ empty.repeat(2) }display: inline-block;
        ${ empty.repeat(2) }width: var(--width);
        ${ empty.repeat(2) }height: var(--height);
        ${ empty.repeat(2) }border-radius: 4px;
        ${ empty.repeat(2) }background-color: rgba(255, 255, 255, 0.75);
        ${ empty.repeat(2) }--width: ${ Number(props.width) }px;
        ${ empty.repeat(2) }--height: ${ Number(props.height) }px;
      }
      `
})

</script>

<template>
  <div class="scripts-preview">
    <div class="dialog-trigger">
      <var-button round size="mini" text type="default" @click="showDialog = true">
        <svg-icon name="preview" size="20px" />
      </var-button>
    </div>
    
    <!---->
    <var-dialog
      v-model:show="showDialog"
      dialog-class="preview-dialog"
      :confirmButton="false"
      :dialog-style="{ '--w' : w, '--h': h }"
      cancel-button-text="关闭"
    >
      <template #title>
        <svg-icon name="preview" size="20px" style="margin-right: 4px;" />
        <span>{{ title }}</span>
      </template>
      
      <div class="code">
        <!-- resource -->
        <highlight-js
          :code
          :download="!isCssVar"
          :download-name="!isCssVar ? `${type}-sprites.svg` : ''"
          pretty
        />
        <!-- html -->
        <highlight-js :code="html" pretty />
        <!-- css -->
        <highlight-js :code="style" pretty />
      </div>
      
      <div class="show">
        <!-- resource -->
        <template v-if="type!=='cssVar'">
          <div v-html="code" />
        </template>
        <template v-else>
          <Teleport to="head">
            <component is="style" v-html="code.replace(/\u00A0/g, '')" />
          </Teleport>
        </template>
        
        <!-- html -->
        <div class="result-preview" v-html="html" />
        
        <!-- css -->
        <Teleport to="head">
          <component is="style" v-html="style.replace(/\u00A0/g, '')" />
        </Teleport>
      </div>
    </var-dialog>
  </div>
</template>

<style scoped>
.scripts-preview {
  display: flex;
  width: 100%;
  height: 100%;
  
  .dialog-trigger {
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
  }
}
</style>

<style>
.preview-dialog {
  width: 80vw;
  height: 80vh;
  --w: 36px;
  --h: 36px;
  
  .var-dialog__title {
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
  }
  
  .var-dialog__message {
    display: grid;
    overflow: auto;
    height: calc(100% - 60px - 54px);
    grid-template-columns: 5fr minmax(240px, 2fr);
    gap: 12px;
    grid-auto-flow: row dense;
    
    .code {
      display: grid;
      overflow: auto;
      height: 100%;
      grid-template-rows: repeat(auto-fit, minmax(120px, 1fr));
      gap: 6px;
    }
    
    .show {
      width: 100%;
      height: 100%;
      min-height: 0;
      
      & > .result-preview {
        display: grid;
        overflow: auto;
        height: 100%;
        grid-template-columns: repeat(auto-fill, minmax(var(--w), 1fr));
        grid-template-rows: repeat(auto-fill, minmax(var(--h), 1fr));
        grid-auto-flow: row dense;
        gap: 6px;
        
        & > * {
          display: flex;
          align-items: center;
          flex-flow: row nowrap;
          justify-content: center;
        }
      }
    }
  }
}
</style>
