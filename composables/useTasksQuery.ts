import {getTasks} from '@/api'
import {useQuery} from '@tanstack/vue-query'
import {Ref, watch} from 'vue'

export function useTasksQuery(projectId: Ref) {
    watch(projectId, () => {
        console.log('projectId changed', projectId.value)
    })
    const {statuses} = useSettings()
    return useQuery({
        queryKey: ['tasks', projectId, statuses.running],
        queryFn: () => getTasks({projectId: projectId.value, taskStatusId: statuses.running}),
        staleTime: Infinity
    })
}
