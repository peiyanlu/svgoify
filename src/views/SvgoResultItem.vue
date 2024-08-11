<script lang="ts" setup>
import HighlightJs from '@/views/HighlightCode.vue'
import { useAttrs, useSlots } from 'vue'


const slots = useSlots()
const attrs = useAttrs()

defineProps<{code:string}>()
</script>

<template>
  <div class="result-item">
    <div v-if="Object.keys(slots).length !== 0" class="header">
      <div style="padding: 0 6px">
        <slot name="left" />
      </div>
      <div>
        <slot name="middle" />
      </div>
      <div>
        <slot name="right" />
      </div>
    </div>
    <div class="content">
      <HighlightJs autodetect :code v-bind="attrs" />
    </div>
  </div>
</template>

<style scoped>
.result-item {
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
  height: 100%;
  gap: 4px;
  --height: 28px;
  
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--height);
    gap: 12px;
  }
  
  .content {
    overflow: auto;
    flex: 1;
    width: 100%;
    height: calc(100% - var(--height) - 4px);
  }
}
</style>
