<script lang="ts" setup>
import { computed } from 'vue'


const props = defineProps<{
  start: number
  end: number
}>()

const isRise = computed(() => props.end > props.start)
const ratio = computed(() => Math.abs(props.start - props.end) / props.start * 100)

const fileSize = (size: number) => {
  if (size === 0) return '0B'
  const k = 1024
  const sizes = [ 'B', 'KB', 'MB', 'GB', 'TB' ]
  const i = Math.floor(Math.log(size) / Math.log(k))
  return (size / Math.pow(k, i)).toPrecision(3) + '' + sizes[i]
}

</script>

<template>
  <var-tooltip color="#3a3a3a" placement="bottom-end">
    <div :style="{color: isRise ? '#D14748' : '#53D592', fontSize: '12px', cursor: 'pointer'}">
      {{ ratio.toFixed(2) + (isRise ? '% ↑' : '% ↓') }}
    </div>
    
    <template #content>
      <div class="statistic-info">
        <div>{{ fileSize(start) }}</div>
        <div>{{ isRise ? '+' : '-' }}</div>
        <div :style="{color: isRise ? '#D14748' : '#53D592'}">
          {{ ratio.toFixed(2) + (isRise ? '% ↑' : '% ↓') }}
        </div>
        <div>=</div>
        <div>{{ fileSize(end) }}</div>
      </div>
    </template>
  </var-tooltip>

</template>

<style scoped>
.statistic-info {
  font-size: 12px;
  display: flex;
  align-items: center;
  flex-flow: row nowrap;
  color: #FFFFFF;
  gap: 4px;
  
  & > div {
    white-space: nowrap;
  }
}
</style>
