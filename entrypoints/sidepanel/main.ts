import {createApp} from 'vue';
import './style.css';
import App from './App.vue';
import {QueryClient, VueQueryPlugin} from '@tanstack/vue-query'
import 'virtual:uno.css'
import 'uno.css'

const app = createApp(App)

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchInterval: 10000,
        },
    },
})
app.use(VueQueryPlugin, {
    queryClient
})

app.mount('#app');
