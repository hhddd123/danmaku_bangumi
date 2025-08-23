import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/router.js'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import persist from 'pinia-plugin-persist'

// 导入插件
import { errorHandlerPlugin, networkErrorHandler, performancePlugin } from '@/plugins/errorHandler'

// 创建Vuetify实例
const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                colors: {
                    primary: '#64b5f6',
                    secondary: '#b0b0b0',
                    background: '#1a1a1a',
                    surface: '#2d2d2d',
                    error: '#f44336',
                    warning: '#ff9800',
                    info: '#2196f3',
                    success: '#4caf50'
                }
            }
        }
    },
    icons: {
        defaultSet: 'mdi'
    }
})

// 创建Pinia实例
const pinia = createPinia()
pinia.use(persist)

// 创建Vue应用
const app = createApp(App)

// 使用插件
app.use(vuetify)
app.use(pinia)
app.use(router)

// 使用自定义插件
app.use(errorHandlerPlugin, {
    showToast: true,
    logToConsole: true,
    reportToService: false
})
app.use(networkErrorHandler)
app.use(performancePlugin)

// 挂载应用
app.mount('#app')
