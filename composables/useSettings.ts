import {computed, reactive} from "vue";

export function useSettings() {
    const isComplete = computed(() =>
        statuses.beginning && statuses.running && statuses.finished && localStorage.getItem('invoiceNinjaAPIToken') && localStorage.getItem('invoiceNinjaURL')
    )
    const statuses = reactive({
        beginning: localStorage.getItem('invoiceNinjaTaskStatusBeginning'),
        running: localStorage.getItem('invoiceNinjaTaskStatusRunning'),
        finished: localStorage.getItem('invoiceNinjaTaskStatusFinished'),
        // beginning: '4zbqp1vGap',
        // running: '3YaOXmlLbx',
        // finished: 'MYerqK4kdO',
    })

    return {statuses, isComplete}
}
