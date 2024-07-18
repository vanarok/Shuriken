import {isTaskRunning} from '@/helpers'
import {Ref, computed} from 'vue'
import {useTasksQuery} from './useTasksQuery'

export function useRunningTask(projectId: Ref) {
    const {data: tasks} = useTasksQuery(projectId)

    const task = computed(() => {
        return tasks.value?.data[0]
    })
    const isRunning = computed<boolean>(() => {
        if (task.value) {
            return isTaskRunning(task.value)
        }
        return false
    })

    return {task, isRunning}
}
