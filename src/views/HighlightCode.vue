<script lang="ts" setup>
import SvgIcon from '@/components/SvgIcon.vue'
import { Snackbar } from '@varlet/ui'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark-dimmed.min.css'

// import 'highlight.js/lib/common'
import javascript from 'highlight.js/lib/languages/javascript'
import html from 'highlight.js/lib/languages/vbscript-html'
import xml from 'highlight.js/lib/languages/xml'
import { computed, ref, watch } from 'vue'


// Then register the languages you need
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', html)

const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#x27;')


const props = withDefaults(defineProps<{
  code: string;
  language?: string;
  autodetect?: boolean;
  ignoreIllegals?: boolean;
  pretty?: boolean
  download?: boolean
  copy?: boolean
  downloadName?: string
}>(), {
  code: '',
  language: 'html',
  autodetect: true,
  ignoreIllegals: true,
  pretty: true,
  copy: true,
  downloadName: 'download.txt',
})

const language = ref(props.language)
watch(() => props.language, (newLanguage) => {
  language.value = newLanguage
})

const autodetect = computed(() => props.autodetect && !language.value)
const cannotDetectLanguage = computed(() => !autodetect.value && !hljs.getLanguage(language.value))

const className = computed((): string => {
  if (cannotDetectLanguage.value) {
    return ''
  } else {
    return `hljs ${ language.value }`
  }
})

const highlightedCode = computed((): string => {
  // 不知道使用什么语言，返回原始代码
  if (cannotDetectLanguage.value) {
    console.warn(`The language "${ language.value }" you specified could not be found.`)
    return escapeHtml(props.code)
  }
  
  if (autodetect.value) {
    const result = hljs.highlightAuto(props.code)
    language.value = result.language ?? ''
    return result.value
  } else {
    const result = hljs.highlight(props.code, {
      language: language.value,
      ignoreIllegals: props.ignoreIllegals,
    })
    return result.value
  }
})


const handleDownload = (str: string, fileName: string) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([ str ]))
  a.download = fileName
  a.click()
}
const handleCopy = (str: string) => {
  navigator.clipboard.writeText(str)
  Snackbar({
    content: 'Copied to clipboard',
    duration: 1000,
    type: 'success',
  })
}
</script>

<template>
  <div class="highlight">
    <div v-if="download || copy" class="action">
      <svg-icon
        v-if="download"
        class="icon"
        name="download"
        size="24px"
        @click="handleDownload(code, downloadName)"
      />
      <svg-icon
        v-if="copy"
        class="icon"
        name="copy"
        size="24px"
        @click="handleCopy(code)"
      />
    </div>
    
    <!-- pre code 莫要换行 -->
    <pre v-if="pretty" class="code"><code :class="className" class="code" v-html="highlightedCode" /></pre>
    <div v-else class="code" v-text="code" />
  </div>
</template>

<style scoped>
.highlight {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--radius);
  --radius: 8px;
  
  .action {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    align-items: center;
    flex-flow: row nowrap;
    justify-content: flex-end;
    padding: 4px 6px;
    transition: all 0.2s ease-in;
    pointer-events: none;
    opacity: 0;
    border-radius: 4px;
    background: rgba(35, 39, 45, 0.75);
    backdrop-filter: blur(5px);
    gap: 6px;
    
    .icon {
      cursor: pointer;
      pointer-events: auto;
      border-radius: 4px;
      
      &:hover {
        color: #53D592;
      }
    }
  }
  
  .code {
    font-family: "JetBrains Mono", Consolas, "Courier New", Courier, monospace;
    font-size: 12px;
    display: block;
    overflow: auto;
    width: 100%;
    height: 100%;
    white-space: pre-line;
    word-break: break-all;
    border-radius: var(--radius);
    
    :deep(& > [class*=language-]) {
      display: block;
      overflow: auto;
      width: 100%;
      height: 100%;
      white-space: pre-line;
      --scrollbar-width: 4px;
    }
  }
  
  &:hover {
    .action {
      z-index: 1;
      opacity: 1;
    }
  }
}
</style>
