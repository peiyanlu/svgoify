<script lang="ts" setup>
import { computed } from 'vue'


const props = defineProps<{
  size?: string
  name: string
  html?: boolean
}>()

const symbolId = computed(() => `#symbol-${ props.name }`)
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
    <svg>
      <use :href="symbolId" />
    </svg>
  </div>
</template>

<style scoped>
.svg-icon {
  display: block;
  width: 1em;
  height: 1em;
  
  & > svg {
    display: block;
    width: 100%;
    height: 100%;
    fill: currentColor;
  }
}
</style>
