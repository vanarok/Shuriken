import {defineConfig} from 'wxt';
import vue from '@vitejs/plugin-vue';
import unocss from 'unocss/vite'

// See https://wxt.dev/api/config.html
export default defineConfig({
    imports: {
        addons: {
            vueTemplate: true,
        },
    },
    vite: () => ({
        plugins: [vue(), unocss()],
        build: {
            // Enabling sourcemaps with Vue during development is known to cause problems with Vue
            sourcemap: false,
        },
    }),
    manifest: {
        name: 'Shuriken: Tasks manager for Invoice Ninja',
        description: 'Open-source alternative for the official Invoice Ninja: Tasks Chrome extension',
        permissions: ["sidePanel"],
        action: {
            "default_title": "Click to open panel"
        },
        commands: {
            "_execute_action": {
                "suggested_key": {
                    "default": "Ctrl+I",
                    "mac": "Ctrl+I"
                }
            }
        }
    },
});
