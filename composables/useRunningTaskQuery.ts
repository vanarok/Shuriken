import {useQuery} from "@tanstack/vue-query";
import {getTasks} from "@/api";
import {useSettings} from "@/composables/useSettings";

export function useRunningTaskQuery(projectId: string | null) {
    const {statuses} = useSettings()
    const query = useQuery({
        queryKey: ['running-task', projectId],
        queryFn: () => getTasks({projectId: projectId || null, taskStatusId: statuses.running}),
    });
    return query
}
