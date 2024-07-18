import {QueryClient, VueQueryPlugin} from '@tanstack/vue-query'
import 'uno.css'
import 'virtual:uno.css'
import {createApp} from 'vue'
import App from './App.vue'
import './style.css'

const app = createApp(App)

const queryClient = new QueryClient({
    defaultOptions: {}
})
app.use(VueQueryPlugin, {
    queryClient
})

app.mount('#app')
