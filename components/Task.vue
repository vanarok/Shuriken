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
        <div class="info">
            <span class="time">{{ getTime() }}</span>
            <button v-if="!task.project_id" class="assign-project-button" @click="enableAssignProjectMode(task)">Assign project</button>
        </div>
    </div>
</template>
<script lang="ts" setup>
import {deleteTask, putTask} from '@/api'
import {useAssignTaskProject} from '@/composables/useAssignTaskProject'
import {useSettings} from '@/composables/useSettings'
import {calculateTime} from '@/helpers'
import {useMutation, useQueryClient} from '@tanstack/vue-query'
import dayjs from 'dayjs'
import {computed, ref} from 'vue'

const props = defineProps<{
    task: Record<any, any>
    project?: unknown | null
}>()

const visibleOverlay = ref(false)
const {statuses} = useSettings()

const {
    mutate: startTask,
    isError,
    error
} = useMutation({
    mutationFn: ({task, status}: {task: Record<any, any>; status: string}) =>
        putTask(task.id, {
            action: 'start',
            data: {...task, status_id: status}
        }),
    onMutate: async ({task, status}) => {
        await queryClient.cancelQueries({queryKey: ['tasks', props.project?.id ?? null, statuses.running]})

        // Snapshot the previous value
        const previousTodos = queryClient.getQueryData(['tasks', props.project?.id ?? null, ''])

        const date = dayjs()
        const unixTimestamp = date.unix()
        const timeLogParsed = JSON.parse(task.time_log)
        const timeLogRunning = [...timeLogParsed, [unixTimestamp, 0]]
        const optimisticTask = {
            data: [
                {
                    ...task,
                    status_id: status,
                    time_log: JSON.stringify(timeLogRunning)
                }
            ],
            meta: {
                pagination: {
                    total: 1,
                    count: 1,
                    per_page: 6,
                    current_page: 1,
                    total_pages: 1,
                    links: {}
                }
            }
        }

        queryClient.setQueryData(['tasks', props.project?.id ?? null, statuses.running], optimisticTask)

        return {optimisticTask, previousTodos}
    },
    onSuccess: (result, variables, context) => {
        // Replace optimistic todo in the todos list with the result
        queryClient.setQueryData(['tasks', props.project?.id ?? null, statuses.running], (old) => ({
            data: old.data.map((task) => (task.id === context.optimisticTask.id ? result.data : task))
        }))
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError(_, __, context) {
        queryClient.setQueryData(['tasks', props.project?.id ?? null], context.previousTodos)
    },
    /*     Always refetch after error or success: */
    onSettled() {
        queryClient.invalidateQueries({queryKey: ['tasks', props.project?.id ?? null]})
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

const getTime = () => {
    const time = Number(
        calculateTime(props.task.time_log, {
            inSeconds: true,
            calculateLastTimeLog: false
        })
    )
    return new Date(time * 1000).toISOString().slice(11, 19)
}
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

    .time {
        color: lightgray;
    }
}

.time {
    text-align: start;
    color: gray;
}

.info {
    display: flex;
    gap: 0.5em;
}
</style>
