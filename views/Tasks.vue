<script lang="ts" setup>
import {useMutation, useQuery, useQueryClient} from '@tanstack/vue-query'
import {getTasks, postTask} from '@/api'
import {computed, Ref, ref, watch} from 'vue'
import Task from '@/components/Task.vue'

const props = defineProps<{
    project: unknown | null
}>()

const filter = ref('')
const projectId = computed(() => props.project?.id ?? null)

const useDebounce = (value: Ref<string>, delay: number): Ref<string> => {
    const debounceValue = ref('')
    let timeoutId: ReturnType<typeof setTimeout>
    watch(value, (newValue) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
            debounceValue.value = newValue
        }, delay)
    })
    return debounceValue
}
const filterDebounced = useDebounce(filter, 1000)
const {
    data: tasks,
    isPending,
    isError,
    error
} = useQuery({
    queryKey: ['tasks', projectId, filterDebounced],
    queryFn: () => getTasks({projectId: projectId.value, filter: filter.value})
})
const inputRef = ref()
window.onkeydown = (e) => {
    if (e.ctrlKey && e.keyCode == 75) {
        // Ctrl+k
        event.preventDefault()
        if (inputRef.value) {
            inputRef.value.focus()
        }
    }
}

const queryClient = useQueryClient()
const {mutate: createTask} = useMutation({
    mutationFn: async ({taskDescription}: {taskDescription: string}) =>
        postTask({
            projectId: props.project?.id ?? null,
            description: taskDescription
        }),
    onSettled() {
        filter.value = ''
        queryClient.invalidateQueries({queryKey: ['tasks', props.project?.id ?? null, '']})
    }
})
</script>

<template>
    <div>
        <div style="position: relative">
            <input
                ref="inputRef"
                v-model.trim="filter"
                placeholder="Find or add a task"
                style="width: 100%; font-size: 1.2em; padding-right: 2.8em"
                type="text"
                @keydown.enter="createTask({taskDescription: filter})"
            />
            <button
                style="
                    font-weight: bold;
                    position: absolute;
                    background: #747bff22;
                    color: #747bff;
                    font-size: large;
                    padding: 0.25em 0.5em;
                    right: 0.2em;
                    top: 0.2em;
                    line-height: 1em;
                "
                @click="createTask({taskDescription: filter})"
            >
                +
            </button>
        </div>
        <h3 style="display: flex; justify-content: center">
            <Transition mode="out-in">
                <div v-if="isPending" class="span-skeleton" style="width: 8em"></div>
                <div v-else-if="isError">Error</div>
                <span v-else-if="!filterDebounced">Recent tasks</span>
                <div v-else-if="!isPending">Found {{ tasks.meta.pagination.total }} tasks</div>
            </Transition>
        </h3>
        <Transition mode="out-in">
            <div v-if="isPending">
                <div v-for="skeleton in 6" class="task-skeleton">
                    <div class="task-text-skeleton"></div>
                </div>
            </div>
            <div v-else-if="isError">{{ error.message }}</div>
            <div v-else class="tasks">
                <TransitionGroup name="list">
                    <Task v-for="task in tasks?.data" :key="task.id" :project :task="task" />
                </TransitionGroup>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.tasks {
    display: flex;
    flex-direction: column;
    gap: 1em;
}

.task-skeleton {
    border-radius: 2em;
    border: 1px solid #747bff22;
    width: 100%;
    height: 7em;
    margin-bottom: 1em;
    display: flex;
    padding: 1.5em;
    box-sizing: border-box;
}

.task-text-skeleton {
    background: #747bff11;
    border-radius: 2em;
    width: 100%;
    height: 1.5em;
}
</style>
