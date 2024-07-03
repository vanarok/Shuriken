import {readonly, Ref, ref, watch} from "vue";
import {useMutation} from "@tanstack/vue-query";
import {putTask} from "@/api";

export const assignProjectMode = ref(false)
export const assignProjectModeTask = ref<unknown | null>(null)

export const useAssignTaskProject = (options?: {
    project?: Ref<unknown | null>,
    cancelCallback?: () => void,
    enableCallback?: () => void
}): {
    assignProjectMode: Readonly<Ref<boolean>>,
    cancelAssignProjectMode?: () => void,
    enableAssignProjectMode?: (task: unknown) => void
    assignTaskProject?: () => void,
} => {
    const updateAssignProjectMode = (value: boolean) => {
        assignProjectMode.value = value
    }
    const updateAssignProjectModeTask = (value: unknown | null) => {
        assignProjectModeTask.value = value
    }
    const cancelAssignProjectMode = () => {
        updateAssignProjectMode(false)
        updateAssignProjectModeTask(null)
    }
    const enableAssignProjectMode = (task: unknown) => {
        updateAssignProjectMode(true)
        updateAssignProjectModeTask(task)
    }

    watch(assignProjectMode, (value, old) => {
        if (value && options.enableCallback) {
            options.enableCallback()
        } else if (options?.project.value && !value && options.cancelCallback) {
            options.cancelCallback()
        }
    })

    const {mutate: assignTaskProject, isPending, isSuccess, error} = useMutation({
        mutationFn: () => putTask(assignProjectModeTask.value.id, {
            action: 'assign',
            data: {...assignProjectModeTask.value, project_id: options.project.value.id}
        }),
        onSuccess(variables) {
            cancelAssignProjectMode()
        },
    })

    watch(error, () => {
        if (error.value) {
            console.log(error.value)
        }
    })

    return {
        assignProjectMode: readonly(assignProjectMode),
        enableAssignProjectMode,
        cancelAssignProjectMode,
        assignTaskProject
    }
}
