import {computed, reactive} from "vue";

export function useSettings() {
    const isComplete = computed(() =>
        statuses.beginning && statuses.running && statuses.finished && localStorage.getItem('invoiceNinjaAPIToken') && localStorage.getItem('invoiceNinjaURL')
    )
    const statuses = reactive({
        beginning: localStorage.getItem('invoiceNinjaTaskStatusBeginning'),
        running: localStorage.getItem('invoiceNinjaTaskStatusRunning'),
        finished: localStorage.getItem('invoiceNinjaTaskStatusFinished'),
    })

    return {statuses, isComplete}
}
