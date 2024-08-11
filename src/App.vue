<script setup lang="ts">
import { ProcessDetector } from './frontend/ProcessDetector'
import { ref } from 'vue'


const isElectron = ProcessDetector.isElectronAppFrontend


const title = ref('')
if (ProcessDetector.isBrowserProcess) {
  title.value = window.document.title
}
</script>

<template>
  <router-view v-if="isElectron" />
  <div v-else class="tips">
    <div>"{{ title }}" 不在 Web 端运行</div>
  </div>
</template>

<style>
.tips {
  width: 100%;
  height: 200px;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 16px;
  font-size: 24px;
}
</style>
