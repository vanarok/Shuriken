<template>
    <div :class="{'task-finished': taskFinished}" class="container" @mouseleave.prevent="visibleOverlay = false" @mouseover.prevent="visibleOverlay = true">
        <textarea
            :class="[{'task-text-overlay-effect': visibleOverlay}]"
            :value="task.description"
            class="task-text"
            disabled
            style="background: none; font-family: Inter; font-size: 1.2em; padding: 0; width: 100%; height: 100%; border: none"
            type="text"
        />
        <Transition mode="out-in">
            <div v-if="visibleOverlay" class="task-actions" @mouseover="visibleOverlay = true">
                <button :disabled="taskFinished" @click="startTask({task, status: statuses.running})">
                    <div class="i-mdi-timer-play-outline" />
                </button>
                <button :disabled="taskFinished" @click="confirmRemoveTask(task)">
                    <div v-if="confirmedRemove" class="i-mdi-delete-alert" />
                    <div v-else class="i-mdi-delete" />
                </button>
                <button @click="setStatus({task, status: taskFinished ? statuses.beginning : statuses.finished})">
                    <div v-if="taskFinished" class="i-mdi-check" />
                    <div v-else class="i-mdi-check-outline" />
                </button>
            </div>
        </Transition>
        <Transition mode="out-in">
            <button v-if="!task.project_id" class="assign-project-button" @click="enableAssignProjectMode(task)">Assign project</button>
        </Transition>
    </div>
</template>
<script lang="ts" setup>
import {computed, ref} from 'vue'
import {deleteTask, putTask} from '@/api'
import {useMutation, useQueryClient} from '@tanstack/vue-query'
import {useAssignTaskProject} from '@/composables/useAssignTaskProject'
import dayjs from 'dayjs'
import {useSettings} from '@/composables/useSettings'

const props = defineProps<{
    task: Record<any, any>
    project?: unknown | null
}>()

const visibleOverlay = ref(false)

const {mutate: startTask} = useMutation({
    mutationFn: ({task, status}: {task: Record<any, any>; status: string}) =>
        putTask(task.id, {
            action: 'start',
            data: {...task, status_id: status}
        }),
    onMutate: async ({task, status}) => {
        await queryClient.cancelQueries({queryKey: ['running-task', props.project?.id ?? null]})
        const previousTodos = queryClient.getQueryData(['running-task', props.project?.id ?? null])
        queryClient.setQueryData(['running-task', props.project?.id ?? null], (old) => {
            const date = dayjs()
            const unixTimestamp = date.unix()
            const timeLogParsed = JSON.parse(task.time_log)
            const timeLogRunning = [...timeLogParsed, [unixTimestamp, 0]]

            return {
                ...old,
                data: [
                    {
                        ...task,
                        status_id: status,
                        time_log: JSON.stringify(timeLogRunning)
                    }
                ]
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
    }
})

const queryClient = useQueryClient()
const {mutate: removeTask} = useMutation({
    mutationFn: (task) => deleteTask(task.id),
    onMutate: async (removedTask) => {
        // Cancel any outgoing refetches
        // (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({queryKey: ['tasks', props.project?.id ?? null, '']})

        // Snapshot the previous value
        const previousTodos = queryClient.getQueryData(['tasks', props.project?.id ?? null, ''])

        // Optimistically update to the new value
        queryClient.setQueryData(['tasks', props.project?.id ?? null, ''], (old) => {
            return {...old, data: [...old.data.filter((t) => t.id !== removedTask.id)]}
        })

        // Return a context object with the snapshotted value
        return {previousTodos}
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (err, newTodo, context) => {
        queryClient.setQueryData(['tasks', props.project?.id ?? null, ''], context.previousTodos)
    },
    // Always refetch after error or success:
    onSettled: () => {
        queryClient.invalidateQueries({queryKey: ['tasks', props.project?.id ?? null, '']})
    }
})

const {enableAssignProjectMode} = useAssignTaskProject()
const confirmedRemove = ref(false)
const confirmRemoveTask = (task: unknown) => {
    if (confirmedRemove.value) {
        removeTask(task)
        confirmedRemove.value = false
    } else {
        confirmedRemove.value = true
        setTimeout(() => {
            confirmedRemove.value = false
        }, 3000)
    }
}

const {statuses} = useSettings()
const {mutate: setStatus} = useMutation({
    mutationFn: ({task, status}: {task: Record<any, any>; status: string}) => {
        return putTask(task.id, {data: {...task, status_id: status}})
    },
    onMutate: async ({task, status}) => {
        await queryClient.cancelQueries({queryKey: ['tasks', props.project?.id ?? null]})
        const previousTodos = queryClient.getQueryData(['tasks', props.project?.id ?? null])
        queryClient.setQueryData(['tasks', props.project?.id ?? null, ''], (old: Record<any, any>) => {
            return {
                data: [...old.data.map((t: Record<any, any>) => (t.id === task.id ? {...t, status_id: status} : t))],
                meta: old.meta
            }
        })

        return {previousTodos}
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError(_, __, context) {
        queryClient.setQueryData(['tasks', props.project?.id ?? null], context.previousTodos)
    },
    // Always refetch after error or success:
    onSettled() {
        queryClient.invalidateQueries({queryKey: ['tasks']})
    }
})
const taskFinished = computed(() => {
    if (props.task.status_id === statuses.finished) {
        return true
    }
    return false
})
</script>

<style scoped>
.container {
    border-radius: 2em;
    border: 1px solid #747bff22;
    width: 100%;
    height: 9em;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    padding: 1.5em;
    box-sizing: border-box;

    .task-text {
        resize: none;
        font-size: 1.2em;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        max-width: 400px;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }

    .task-actions {
        display: flex;
        align-items: center;
        gap: 1em;
        justify-content: end;
        position: absolute;
        right: 50%;
        bottom: 50%;
        transform: translate(50%, 50%);

        button {
            box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);

            div {
                font-size: 2em;
            }
        }
    }

    .task-text-overlay-effect {
        filter: blur(2px);
    }
}

.assign-project-button {
    text-align: left;
    background: #747bff22;
    border-radius: 1em;
    width: max-content;
    padding: 0.2em 0.8em;
    font-weight: bold;
    color: #747bff;
}

.task-finished {
    background: #f9f9f9;
    border-color: #f9f9f9;

    textarea {
        color: gray;
    }
}
</style>
