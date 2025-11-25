<script lang="ts" setup>
import SvgIcon from '@/components/SvgIcon.vue'
import { nextTick, onMounted, ref } from 'vue'
import { svgoPlugins, SvgoPluginsDataList } from './SvgoPlugins'


const emits = defineEmits([ 'getPlugins' ])

const showDialog = ref<boolean>(false)
const list = ref<SvgoPluginsDataList[]>(svgoPlugins)

const getStr = (list: SvgoPluginsDataList[]) => {
  return list.slice().filter(k => k.active).sort().map(s => s.id).join()
}

let def = getStr(svgoPlugins)

const handleConfirm = () => {
  nextTick(() => {
    const res = getStr(list.value)
    if (res !== def) {
      def = getStr(list.value)
      emits('getPlugins', res.split(','))
    }
  })
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
        <svg-icon name="setting" size="24px" />
      </var-button>
    </div>
    
    <!---->
    <var-dialog
      v-model:show="showDialog"
      dialog-class="params-dialog"
    >
      <template #title>
        <svg-icon name="setting" size="21px" />
        <div>插件设置</div>
      </template>
      
      <div v-for="item of list" :key="item.name" class="item">
        <var-switch v-model="item.active" @change="handleConfirm" />
        <div>{{ item.name }}</div>
        <var-tooltip
          v-if="item.description"
          trigger="hover"
          color="rgba(var(--primary-background-color), 1)"
        >
          <template #content>
            <div
              style="
                color: rgba(var(--primary-color), 1);
                max-width: 280px;
                word-break: break-all;
                text-align: left;
             "
            >
              {{ item.description }}
              <var-link
                v-if="!item.isCustom"
                type="success"
                :href="`https://svgo.dev/docs/plugins/${item.id}/`"
                target="_blank"
              >
                <var-icon name="information-outline" size="16px" />
              </var-link>
            </div>
          </template>
          <var-icon
            name="information-outline"
            style="opacity: .55;cursor: pointer;display: flex;"
          />
        </var-tooltip>
      </div>
      
      <template #actions>
        <div />
      </template>
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
  height: 65vh;
  
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
    height: calc(100% - 45px - 45px);
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
