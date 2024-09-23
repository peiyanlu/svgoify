<script lang="ts" setup>
import SvgoResult from '@/views/SvgoResult.vue'
import SvgoUpload from '@/views/SvgoUpload.vue'
import { SvgoOptimizeResult } from '@/common/ElectronIpcInterface'
import { ref } from 'vue'


const loading = ref(false)
const formats = ref<SvgoOptimizeResult[]>([])
</script>

<template>
  <div class="svgo-wrapper">
    <var-loading
      type="wave"
      description="LOADING"
      :loading="loading"
      class="aaa"
    >
      <div class="svgo-container">
        <SvgoUpload
          v-model:loading="loading"
          v-model:formats="formats"
        />
        <SvgoResult
          v-model:result="formats"
        />
      </div>
    </var-loading>
  </div>
</template>

<style scoped>
.svgo-wrapper {
  width: 100%;
  height: 100%;
  
  .var-loading{
    width: 100%;
    height: 100%;
    
    :deep(& > .var-loading__content) {
      width: 100%;
      height: 100%;
    }
  }
}

.svgo-container {
  width: 100%;
  min-width: 640px;
  height: 100%;
  margin-right: 8px;
  overflow-y: scroll;
  padding: 16px calc(16px - var(--scrollbar-width)) 16px 16px;
  display: grid;
  grid-template-rows: 180px 1fr;
  gap: 16px;
  
  &::-webkit-scrollbar {
    background-color: transparent;
  }
}
</style>
