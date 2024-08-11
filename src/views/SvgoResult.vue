<script lang="ts" setup>
import SvgIcon from '@/components/SvgIcon.vue'
import StatisticInfo from '@/views/StatisticInfo.vue'
import { Svg2ClipPath } from '@/utils/Svg2ClipPath'
import { Svg2CSSVar } from '@/utils/Svg2CSSVar'
import { Svg2Symbol } from '@/utils/Svg2Symbol'
import SvgoEditDialog from '@/views/SvgoEditDialog.vue'
import SvgoResultItem from '@/views/SvgoResultItem.vue'
import SvgScriptsPreview from '@/views/SvgoSpritesPreview.vue'
import { SvgoOptimizeResult } from '@/common/ElectronIpcInterface'
import { computed, ref } from 'vue'


const value = ref([ '1' ])

let result = defineModel<SvgoOptimizeResult[]>('result', {default: []})

const handleDownload = (str: string, name: string) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([ str ]))
  a.download = name
  a.click()
}

const handleDelete = (index: number) => {
  result.value.splice(index, 1)
}

const iconWidth = ref<string>('36')
const iconHeight = ref<string>('36')
const inputRange = (input: string, min: number, max: number) => {
  const val = isNaN(Number(input)) ? min : Number(input)
  return String(Math.min(Math.max(val, min), max))
}


const clipPathVal = computed(() => {
  return Svg2ClipPath(
    result.value.map(k => ({ code: k.output, id: k.parse.name })),
    +iconWidth.value,
    +iconHeight.value,
  )
})

const symbolVal = computed(() => {
  return Svg2Symbol(result.value.map(k => ({ code: k.output, id: k.parse.name })))
})

const cssVarVal = computed(() => {
  return Svg2CSSVar(result.value.map(k => ({ code: k.enc, id: k.parse.name })))
})


</script>

<template>
  <div class="result-container" v-if="result.length">
    <var-collapse v-model="value" ref="collapseRef" :divider="false">
      <var-collapse-item title="压缩" name="1">
        <template #title>
        
        </template>
        
        <div class="flex-column">
          <div class="grid table-header">
            <div
              v-for="item of ['预览', 'SVG压缩代码', 'base64代码','转义代码', '未转义代码', '操作']"
              :key="item"
            >
              {{
                item
              }}
            </div>
          </div>
          <div v-for="(item, index) of result" class="grid result-list">
            <div class="preview">
              <SvgoEditDialog :code="item.output" :name="item.parse.base" />
              <StatisticInfo :end="item.outputSize" :start="item.inputSize" />
            </div>
            <SvgoResultItem :code="item.output" :download-name="item.parse.base" download />
            <SvgoResultItem :code="item.base64" />
            <SvgoResultItem :code="item.enc" />
            <SvgoResultItem :code="item.unenc" />
            <div class="action">
              <svg-icon name="download" size="28px" @click="handleDownload(item.output, item.parse.base)" />
              <svg-icon name="delete" size="28px" @click="handleDelete(index)" />
            </div>
          </div>
        </div>
      </var-collapse-item>
      <var-collapse-item title="精灵图" name="2">
        <template #title>
        
        </template>
        
        <div class="flex-column">
          <div class="svg-symbol">
            <SvgoResultItem
              :code="symbolVal"
              download
              download-name="symbol-sprites.svg"
            >
              <template #left>
                <div>Symbol Sprites</div>
              </template>
              <template #right>
                <SvgScriptsPreview :code="symbolVal" title="Symbol Sprites" type="symbol" />
              </template>
            </SvgoResultItem>
          </div>
          <div class="svg-clipPath">
            <SvgoResultItem
              :code="clipPathVal"
              download
              download-name="clipPath-sprites.svg"
              title="ClipPath Sprites"
            >
              <template #left>
                <div>ClipPath Sprites</div>
              </template>
              <template #middle>
                <div class="clipPath-icon-size">
                  <div>图标大小：</div>
                  <var-input
                    v-model="iconWidth"
                    :hint="false"
                    min="0"
                    placeholder="width"
                    size="small"
                    type="number"
                    @input="(val:string)=> iconWidth = inputRange(val, 0, 10000)"
                  />
                  <var-input
                    v-model="iconHeight"
                    :hint="false"
                    min="0"
                    placeholder="height"
                    size="small"
                    type="number"
                    @input="(val:string)=> iconHeight = inputRange(val, 0, 10000)"
                  />
                </div>
              </template>
              <template #right>
                <SvgScriptsPreview
                  :code="clipPathVal"
                  :height="iconHeight"
                  :width="iconWidth"
                  title="ClipPath Sprites"
                  type="clipPath"
                />
              </template>
            </SvgoResultItem>
          </div>
          <div class="svg-cssVar">
            <SvgoResultItem :code="cssVarVal">
              <template #left>
                <div>CSS Var</div>
              </template>
              <template #right>
                <SvgScriptsPreview
                  :code="cssVarVal"
                  title="CSS Var"
                  type="cssVar"
                />
              </template>
            </SvgoResultItem>
          </div>
          <var-back-top :duration="300" />
        </div>
      </var-collapse-item>
    </var-collapse>
  </div>
</template>

<style scoped>
.result-container {
  .grid {
    display: grid;
    width: 100%;
    padding: 8px;
    grid-template-columns: 60px 1fr 1fr 1fr 1fr 40px;
    grid-template-rows: 100%;
    gap: calc(2% / 4);
  }
  
  .table-header {
    white-space: nowrap;
    
    :nth-child(2) {
      min-width: 200px;
    }
  }
  
  .result-list {
    max-height: 140px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    
    .preview {
      display: flex;
      align-items: center;
      flex-flow: column nowrap;
      justify-content: center;
      color: var(--color-primary);
      gap: 6px;
    }
    
    .action {
      display: flex;
      align-items: center;
      flex-flow: column nowrap;
      justify-content: center;
      gap: 16px;
      
      .svg-icon {
        padding: 3px;
        cursor: pointer;
        border-radius: 4px;
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        &:first-child {
          color: #53D592;
        }
        
        &:last-child {
          color: #D14748;
        }
      }
    }
  }
  
  .svg-symbol,
  .svg-clipPath,
  .svg-cssVar {
    width: 100%;
    display: grid;
    max-height: 200px;
    padding: 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    grid-template-columns: 100%;
    grid-template-rows: 100%;
    
    .clipPath-icon-size {
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      
      :deep(.var-input__input) {
        font-size: 14px;
        width: 40px;
        height: 14px;
        text-align: center;
        
        &::placeholder {
          font-size: 12px;
        }
      }
    }
  }
}
.flex-column {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 8px;
}
</style>
