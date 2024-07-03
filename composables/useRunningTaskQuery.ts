import {useQuery} from "@tanstack/vue-query";
import {getTasks} from "@/api";

export function useRunningTaskQuery(projectId: string | null) {
    const query = useQuery({
        queryKey: ['running-task', projectId],
        queryFn: () => getTasks({projectId: projectId || null, taskStatusId: '3YaOXmlLbx'}),
    });
    return query
}
