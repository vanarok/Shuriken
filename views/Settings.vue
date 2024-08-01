<script lang="ts" setup>
import {computed, ref} from 'vue'
import {useQuery} from '@tanstack/vue-query'
import {getTaskStatuses} from '@/api'
import {capitalizeFirstLetter} from '../helpers'

const invoiceNinjaURL = ref(localStorage.getItem('invoiceNinjaURL') || 'https://invoicing.co/api/v1')
const invoiceNinjaAPIToken = ref(localStorage.getItem('invoiceNinjaAPIToken') || '')

const saveAPI = () => {
    localStorage.setItem('invoiceNinjaURL', invoiceNinjaURL.value)
    localStorage.setItem('invoiceNinjaAPIToken', invoiceNinjaAPIToken.value)
    window.location.reload()
}

const saveStatuses = () => {
    localStorage.setItem('invoiceNinjaTaskStatusBeginning', statuses.beginning)
    localStorage.setItem('invoiceNinjaTaskStatusRunning', statuses.running)
    localStorage.setItem('invoiceNinjaTaskStatusFinished', statuses.finished)
    window.location.reload()
}

const {statuses, isComplete} = useSettings()

const enabled = computed(() => !!(localStorage.getItem('invoiceNinjaAPIToken') && localStorage.getItem('invoiceNinjaURL')))
const {
    data: options,
    isPending,
    isError
} = useQuery({
    enabled,
    queryKey: ['task-statuses'],
    queryFn: getTaskStatuses
})

const updateStatus = (value: string | null, key: 'beginning' | 'running' | 'finished') => {
    statuses[key] = value
}
</script>

<template>
    <div class="container">
        <h2>{{ isComplete ? 'Settings' : 'Setup' }}</h2>
        <form class="connect-invoice-ninja" @submit.prevent="saveAPI">
            <h3 for="token">
                1. Get token from
                <a href="https://app.invoicing.co/?#/settings/integrations/api_tokens/create" target="_blank">Invoice Ninja</a>
            </h3>

            <input v-model="invoiceNinjaAPIToken" placeholder="xxxxxxxxxxxxxx" required type="text" />
            <details class="extends-settings">
                <summary class="extends-settings-button">Extend settings</summary>
                <label for="url">Invoice Ninja API URL (optional)</label>
                <input v-model="invoiceNinjaURL" placeholder="Example: https://invoicing.co/api/v1" type="text" />
            </details>
            <button type="submit">Save</button>
        </form>
        <Transition mode="out-in">
            <form v-if="enabled" class="select-statuses" @submit.prevent="saveStatuses">
                <h3>
                    2. Select
                    <a href="https://app.invoicing.co/?#/settings/task_settings">statuses</a>
                    for task
                </h3>
                <template v-for="(value, key) in statuses" style="width: 100%; display: flex; align-items: start; flex-direction: column; gap: 0.5em">
                    <label :for="value || key">{{ capitalizeFirstLetter(key) }} status</label>
                    <template v-if="isError">
                        <select :id="value || key" disabled required>
                            <option selected value="">Error</option>
                        </select>
                    </template>
                    <template v-else-if="isPending">
                        <select :id="value || key" disabled required>
                            <option selected value="">Loading...</option>
                        </select>
                    </template>

                    <template v-else>
                        <select :id="value || key" :value="value" required @change="updateStatus($event.target.value, key)">
                            <option disabled selected value="">Please select one</option>
                            <option v-for="{id, name} in options.data" :value="id">
                                {{ name }}
                            </option>
                        </select>
                    </template>
                </template>

                <button type="submit">Save</button>
            </form>
        </Transition>
    </div>
</template>

<style scoped>
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
}

.connect-invoice-ninja {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    width: 20em;
    margin-bottom: 3em;
}

.select-statuses {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    width: 20em;
}

button {
    margin-top: 1em;
}

.extends-settings {
    width: 100%;
    text-align: start;
    margin: 1em 0;
}

.extends-settings-button {
    filter: brightness(0.5);
    color: ghostwhite;
    margin-bottom: 1em;
}

.extends-settings-button::marker {
    content: '';
}
</style>
