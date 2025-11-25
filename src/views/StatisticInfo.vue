<script lang="ts" setup>
import { computed, defineComponent, h } from 'vue'


const fileSize = (size: number) => {
  if (size === 0) return '0B'
  const k = 1024
  const sizes = [ 'B', 'KB', 'MB', 'GB', 'TB' ]
  const i = Math.floor(Math.log(size) / Math.log(k))
  return (size / Math.pow(k, i)).toPrecision(3) + '' + sizes[i]
}

const props = defineProps<{
  start: number
  end: number
}>()

const isRise = computed(() => props.end > props.start)
const percentArrow = computed(() => isRise.value ? '% ↑' : '% ↓')
const plusMinusSign = computed(() => isRise.value ? '+' : '-')
const color = computed(() => isRise.value ? '#D14748' : '#53D592')
const ratio = computed(() => {
  const res = Math.abs(props.start - props.end) / props.start * 100
  return res.toFixed(2) + percentArrow.value
})


interface Props {
  color: string
  ratio: string
}

const RatioDisplay = (props: Props) => {
  return h(
    'div',
    {
      style: {
        color: props.color,
        fontSize: '12px',
        cursor: 'pointer',
      },
    },
    props.ratio,
  )
}

// const RatioDisplay = defineComponent(
//   (props) => {
//     return () => h(
//       'div',
//       {
//         style: {
//           color: props.color,
//           fontSize: '12px',
//           cursor: 'pointer',
//         },
//       },
//       props.ratio,
//     )
//   },
//   {
//     props: {
//       color: {
//         type: String,
//         default: '#D14748',
//       },
//       ratio: {
//         type: String,
//         default: '0',
//       },
//     },
//   },
// )
</script>

<template>
  <var-tooltip
    color="rgba(var(--primary-background-color), 1)"
    placement="bottom-end"
  >
    <RatioDisplay :color :ratio />
    
    <template #content>
      <div class="statistic-info">
        <div>{{ fileSize(start) }}</div>
        
        <div>{{ plusMinusSign }}</div>
        
        <RatioDisplay :color :ratio />
        
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
  color: rgba(var(--primary-color), 1);
  gap: 4px;
  
  & > div {
    white-space: nowrap;
  }
}
</style>
