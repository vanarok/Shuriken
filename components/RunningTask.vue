<script lang="ts" setup>
import {computed, ref} from "vue";
import {useMutation, useQueryClient} from "@tanstack/vue-query";
import {putTask} from "@/api";
import {calculateTime} from "@/helpers";
import {useRunningTaskQuery} from "@/composables/useRunningTaskQuery";

const props = defineProps<{
    project: unknown | null
}>();
const emit = defineEmits<{
    (e: 'stop-task'): void
}>()

const {data: tasks, isPending} = useRunningTaskQuery(props.project?.id ?? null)
const task = computed(() => {
    return tasks.value.data[0];
});

const queryClient = useQueryClient()


const {mutate: stopTask} = useMutation({
    mutationFn: ({task, status}: { task: Record<any, any>, status: string }) => putTask(task.id, {
        action: 'stop',
        data: {...task, status_id: status}
    }),
    onMutate: async () => {
        await queryClient.cancelQueries({queryKey: ['running-task', props.project?.id ?? null]})
        const previousTodos = queryClient.getQueryData(['running-task', props.project?.id ?? null])
        queryClient.setQueryData(['running-task', props.project?.id ?? null], (old) => {
            return {
                data: [],
                meta: []
            }
        })
        return {previousTodos}
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError(_, __, context) {
        queryClient.setQueryData(['running-task', props.project?.id ?? null], context.previousTodos)
    },
    // Always refetch after error or success:
    onSettled() {
        queryClient.invalidateQueries({queryKey: ['running-task', props.project?.id ?? null]})
        queryClient.invalidateQueries({queryKey: ['projects']})
    },
})

const time = ref(0);
const calculation = calculateTime(task.value.time_log, {
    inSeconds: true,
    calculateLastTimeLog: false,
});

time.value = Number(calculation)

setInterval(() => {
    time.value = (time.value + 1)
}, 1000);

const {statuses} = useSettings();
</script>

<template>
    <div class="project">
        <div v-if="isPending">Loading...</div>
        <h2 v-else>
            <p class="time">{{ new Date(time * 1000).toISOString().slice(11, 19) }}</p>
            <p>{{ task.description }}</p>
            <p v-if="task.project">{{ task.project.name }}</p>
        </h2>
        <button @click="stopTask({task, status: statuses.beginning})">Stop</button>
    </div>
</template>

<style scoped>
.project {
    display: flex;
    flex-direction: column;
    align-items: center;

    .time {
        font-size: xx-large;
    }

    button {
        font-size: x-large;
        width: 6em;
    }
}
</style>
