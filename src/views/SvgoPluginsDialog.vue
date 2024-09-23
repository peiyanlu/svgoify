<script lang="ts" setup>
import { reactive, ref, watch } from 'vue'
import { SvgoPlugins } from './SvgoPlugins'


const getStr = (list: (typeof SvgoPlugins)) => {
  return list.slice().filter(k => k.active).map(s => s.id).join()
}


let def = getStr(SvgoPlugins)

const emits = defineEmits([ 'getPlugins' ])

const showDialog = ref<boolean>(false)
const list = reactive(SvgoPlugins)


watch(showDialog, (value: boolean) => {
  if (value) {
    def = getStr(list)
  }
})

const handleConfirm = () => {
  const res = getStr(list)
  
  if (res !== def) {
    emits('getPlugins', res.split(','))
  }
}
</script>

<template>
  <div class="params-container">
    <div class="dialog-trigger">
      <!--<span>压缩参数设置</span>-->
      <var-button
        round
        size="mini"
        text
        type="default"
        @click="showDialog = true"
      >
        <var-icon name="cog" size="24px" />
      </var-button>
    </div>
    
    <!---->
    <var-dialog
      v-model:show="showDialog"
      dialog-class="params-dialog"
      @confirm="handleConfirm"
    >
      <template #title>
        <var-icon name="cog" />
        <span>压缩参数设置</span>
      </template>
      
      <div v-for="item of list" :key="item.name" class="item">
        <var-switch v-model="item.active" />
        <div>{{ item.name }}</div>
        <var-tooltip
          v-if="item.description"
          trigger="click"
          color="rgba(var(--primary-background-color), 1)"
        >
          <template #content>
            <div style="color: rgba(var(--primary-color), 1);">{{ item.description }} </div>
          </template>
          <var-icon
            name="information-outline"
            style="opacity: 0.75;cursor: pointer;display: flex;"
          />
        </var-tooltip>
      </div>
    </var-dialog>
  </div>
</template>

<style scoped>
.params-container {
  
  .dialog-trigger {
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 2px;
  }
}

</style>

<style>
.params-dialog {
  width: 80vw;
  height: 60vh;
  
  .var-dialog__title {
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
  }
  
  .var-dialog__message {
    display: grid;
    overflow: auto;
    height: calc(100% - 60px - 54px);
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
    grid-auto-flow: row dense;
    
    .item {
      display: flex;
      align-items: center;
      flex-flow: row nowrap;
      justify-content: flex-start;
      white-space: nowrap;
      gap: 8px;
    }
  }
}

</style>
