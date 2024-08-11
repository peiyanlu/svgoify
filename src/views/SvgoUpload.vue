<script setup lang="ts">
import SvgIcon from '@/components/SvgIcon.vue'
import { SvgoPlugins } from '@/views/SvgoPlugins'
import SvgoPluginsDialog from '@/views/SvgoPluginsDialog.vue'
import { SvgoOptimizeResult } from '@/common/ElectronIpcInterface'
import { ElectronApp } from '@/frontend/ElectronApp'
import { useDropZone, useEventListener } from '@vueuse/core'
import JSZip from 'jszip'
import { ref, watch } from 'vue'


ElectronApp.startup()

const loading = defineModel('loading', { default: false })
const formats = defineModel<SvgoOptimizeResult[]>('formats', { default: [] })

const plugins = ref(SvgoPlugins.slice().filter(k => k.active).map(s => s.id))

const loadingHelper = async (fn: () => Promise<void>) => {
  loading.value = true
  await fn()
  loading.value = false
}

// 选择文件
const handleOpenFile = async () => {
  const { filePaths } = await ElectronApp.dialogIpc.showOpenDialog({
    properties: [ 'openFile', 'multiSelections' ],
    title: '选择文件',
    filters: [ { name: 'SVG', extensions: [ 'svgz', 'svg' ] } ],
  })
  
  if (!filePaths.length) return
  
  await loadingHelper(async () => {
    const res = await ElectronApp.svgoIpc.compressPaths(filePaths, { plugins: [ ...plugins.value ] })
    formats.value = formats.value.concat(res)
  })
}

// 选择文件夹
const handleOpenDir = async () => {
  const { filePaths: [ dir ] } = await ElectronApp.dialogIpc.showOpenDialog({
    properties: [ 'openDirectory' ],
    title: '选择文件夹',
  })
  
  if (!dir) return
  
  await loadingHelper(async () => {
    const res = await ElectronApp.svgoIpc.compressDir(dir, { plugins: [ ...plugins.value ] })
    formats.value = formats.value.concat(res)
  })
}

// 拖拽上传
const dropZoneRef = ref<HTMLDivElement>()
const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: async (files: File[] | null) => {
    if (!files) return
    
    await loadingHelper(async () => {
      const filePaths = files.map((file) => file.path)
      const res = await ElectronApp.svgoIpc.compressPaths(filePaths, { plugins: [ ...plugins.value ] })
      formats.value = formats.value.concat(res)
    })
  },
  dataTypes: [ 'image/svg+xml' ],
})

// 粘贴上传
useEventListener('paste', async (evt: ClipboardEvent) => {
  let code = evt.clipboardData?.getData('text') ?? ''
  code = code.replace(/[^\x20-\xFF]/gi, '')
  if (/<svg[\w\W]*?>[\w\W]+<\/svg>/gi.test(code)) {
    const res = [ await ElectronApp.svgoIpc.compressStr(code, { plugins: [ ...plugins.value ] }) ]
    formats.value = formats.value.concat(res)
  } else {
    console.log('粘贴文本并未包含 SVG 信息')
  }
})

// 重新转换
watch(plugins, async (val) => {
  await loadingHelper(async () => {
    formats.value = await Promise.all(formats.value.map(async item => {
      const { input, parse } = item
      const { parse: _a, ...others } = await ElectronApp.svgoIpc.compressStr(
        input,
        { plugins: [ ...val ] },
      )
      return { parse, ...others }
    }))
  })
})

// 下载全部
const downloadAll = async (data: SvgoOptimizeResult[]) => {
  const zip = JSZip()
  data.forEach(obj => {
    zip.file(obj.parse.base, obj.output)
  })
  
  const content = await zip.generateAsync({ type: 'blob' })
  
  const eleLink = document.createElement('a')
  eleLink.download = `icons-all-min.zip`
  eleLink.href = URL.createObjectURL(content)
  eleLink.click()
  URL.revokeObjectURL(eleLink.href)
}

</script>

<template>
  <div class="svgo-upload">
    <div ref="dropZoneRef" :class="{light: isOverDropZone}" class="dropZone">
      <div class="tips-icon">
        <div class="action">
          <var-button text-color="#ffffffa1" @click="handleOpenFile">
            <svg-icon name="svg" size="24px" />
            <span style="margin-left: 4px">文件</span>
          </var-button>
          <var-button text-color="#ffffffa1" @click="handleOpenDir">
            <svg-icon name="folder-svg" size="24px" />
            <span style="margin-left: 4px">文件夹</span>
          </var-button>
        </div>
        <svg-icon name="drag-upload" size="72px" />
      </div>
      <div class="tips-text">
        <span>拖拽 SVG 文件到此处</span>
        <span>or</span>
        <span>Ctrl + V 粘贴 SVG 代码</span>
        <div class="flex-center">
          <SvgoPluginsDialog @getPlugins="(data)=> plugins = data" />
          <var-button
            v-if="formats.length"
            round
            size="mini"
            text
            type="default"
            @click="downloadAll(formats)"
          >
            <var-tooltip style="display: block;" content="下载全部" type="success">
              <svg-icon style="color: #53D592;" name="download" size="24px" />
            </var-tooltip>
          </var-button>
          <var-button
            v-if="formats.length"
            round
            size="mini"
            text
            type="default"
            @click="()=>formats.length = 0"
          >
            <var-tooltip style="display: block;" content="删除全部" type="danger">
              <svg-icon style="color: #D14748;" name="delete" size="24px" />
            </var-tooltip>
          </var-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.svgo-upload {
  width: 100%;
  height: 100%;
  min-height: 180px;
  
  .dropZone {
    display: flex;
    align-items: center;
    flex-flow: column nowrap;
    justify-content: center;
    width: 100%;
    height: 100%;
    border: 2px dashed rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    gap: 16px;
    
    .tips-icon {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      color: rgba(255, 255, 255, 0.3);
      gap: 24px;
      
      .action {
        display: flex;
        align-items: center;
        flex-flow: column nowrap;
        justify-content: center;
        gap: 12px;
      }
    }
    
    .tips-text {
      font-size: 12px;
      line-height: 1;
      display: flex;
      align-items: center;
      flex-flow: row wrap;
      justify-content: center;
      user-select: none;
      opacity: 0.6;
      gap: 8px;
    }
    
    &.light {
      border-color: aquamarine;
    }
  }
  
  .flex-center {
    display: flex;
    align-items: center;
    flex-flow: row nowrap;
    justify-content: center;
  }
}
</style>
