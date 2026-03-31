import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import SvgIcon from './components/SvgIcon.vue'
import router from './router'
import 'virtual:svg-icons-register'
import '@varlet/touch-emulator'
import '@varlet/ui/es/style.mjs'
import './theme/index'


createApp(App)
  .use(router)
  .component('svg-icon', SvgIcon)
  .mount('#app')


console.log('👋 This message is being logged by "renderer.ts", included via Vite')
