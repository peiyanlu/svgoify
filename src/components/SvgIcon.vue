<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'


const props = defineProps<{
  size?: string
  name: string
  html?: boolean
}>()

const symbolId = computed(() => `#symbol-${ props.name }`)

const viewBox = ref('0 0 24 24')
watchEffect(() => {
  if (!props.html) {
    const symbol = document.querySelector<SVGSymbolElement>(`#symbol-${ props.name }`)
    if (symbol && symbol.getAttribute('viewBox')) {
      viewBox.value = symbol.getAttribute('viewBox')
    }
  }
})
</script>

<template>
  <div
    v-if="html"
    :style="{
      width: props.size,
      height: props.size,
    }"
    aria-hidden="true"
    class="svg-icon"
    v-html="name"
  />
  <div
    v-else
    :style="{
      width: props.size,
      height: props.size,
    }"
    class="svg-icon"
  >
    <svg :viewBox="viewBox">
      <use :href="symbolId" />
    </svg>
  </div>
</template>

<style scoped>
.svg-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1em;
  height: 1em;
  
  & > :deep(svg) {
    display: block;
    width: 100%;
    height: 100%;
    fill: currentColor;
  }
}
</style>
