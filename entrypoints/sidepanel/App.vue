<script lang="ts" setup>
import {VueQueryDevtools} from '@tanstack/vue-query-devtools'
import Tasks from '@/views/Tasks.vue'
import Projects from '@/views/Projects.vue'
import {computed, ref} from 'vue'
import RunningTask from '@/components/RunningTask.vue'
import {useRunningTaskQuery} from '@/composables/useRunningTaskQuery'
import {isTaskRunning} from '@/helpers'
import ProjectsActivator from '@/components/ProjectsActivator.vue'
import {useAssignTaskProject} from '@/composables/useAssignTaskProject'
import Settings from '@/views/Settings.vue'
import {useSettings} from '@/composables/useSettings'

const page = ref<'tasks' | 'projects' | 'settings'>('tasks')
const project = ref<unknown | null>(JSON.parse(localStorage.getItem('project')) || null)
const projectId = computed(() => project.value?.id)
const updateProjectChoose = (c) => {
    project.value = c
    page.value = 'tasks'
    assignTaskProject(c)
    localStorage.setItem('project', JSON.stringify(c))
}

const spentHoursColor = computed(() => {
    if (project.value.current_hours === 0) {
        return
    } else if (project.value.current_hours > project.value.budgeted_hours) {
        return 'control-panel__values__value-red'
    } else if (project.value.current_hours === project.value.budgeted_hours) {
        return 'control-panel__values__value-yellow'
    } else if (project.value.current_hours < project.value.budgeted_hours) {
        return 'control-panel__values__value-green'
    }
})

const {data: tasks} = useRunningTaskQuery(project.value?.id ?? null)
const taskRunning = computed(() => {
    const firstRunningTask = tasks.value?.data[0]
    if (firstRunningTask) {
        return isTaskRunning(firstRunningTask)
    }
    return false
})

const {assignProjectMode, cancelAssignProjectMode, assignTaskProject} = useAssignTaskProject({
    project,
    cancelCallback: () => {
        page.value = 'tasks'
    },
    enableCallback: () => {
        page.value = 'projects'
    }
})

const {statuses, isComplete} = useSettings()
if (!isComplete.value) {
    page.value = 'settings'
}
</script>

<template>
    <div class="project">
        <Transition mode="out-in">
            <RunningTask v-if="taskRunning" :project />
            <div v-else style="display: flex; flex-direction: column; gap: 1em">
                <div class="control-panel">
                    <Transition mode="out-in">
                        <div v-if="page === 'tasks'" style="display: flex; flex-direction: column; gap: 1em; width: 100%; align-items: center">
                            <ProjectsActivator :projectId @open-projects-page="page = 'projects'" @clear-project-choose="updateProjectChoose(null)" />
                            <div v-if="project" class="values">
                                <div>
                                    Budget
                                    <div class="value">{{ project.budgeted_hours }}h</div>
                                </div>
                                <div>
                                    Spent
                                    <div :class="spentHoursColor" class="value">{{ project.current_hours }}h</div>
                                </div>
                                <div v-if="project.due_date">
                                    Due date
                                    <div class="value" style="width: 8em">{{ new Date(project.due_date).toLocaleDateString() }}</div>
                                </div>
                            </div>
                        </div>
                        <button v-else-if="assignProjectMode" id="project-choose-activator" @click="cancelAssignProjectMode">
                            <span>Cancel</span>
                        </button>
                        <button v-else-if="page === 'projects' || page === 'settings'" id="project-choose-activator" @click="page = 'tasks'">
                            <span>Return to tasks</span>
                        </button>
                    </Transition>
                </div>
                <Transition mode="out-in">
                    <Tasks v-if="page === 'tasks'" :project="project" />
                    <Projects v-else-if="page === 'projects'" @project-choose="updateProjectChoose" />
                    <Settings v-else-if="page === 'settings'" />
                </Transition>
                <button v-if="page !== 'settings'" class="settings-button i-mdi-cog" @click="page = 'settings'" />
            </div>
        </Transition>
    </div>
    <VueQueryDevtools />
</template>

<style scoped>
.project {
    display: flex;
    flex-direction: column;

    .control-panel {
        display: flex;
        gap: 1em;
        justify-content: space-between;
        position: relative;

        .values {
            display: flex;
            justify-content: center;
            gap: 1em;
            width: 5em;

            .value {
                background: #747bff11;
                border-radius: 2em;
                font-size: 1.2em;
                padding: 0.4em 0;
                width: 4em;
                font-weight: 600;
            }

            .control-panel__values__value-red {
                background: #ff000011;
                border-radius: 2em;
                height: 1.5em;
            }

            .control-panel__values__value-green {
                background: #00ff0011;
                border-radius: 2em;
                height: 1.5em;
            }

            .control-panel__values__value-yellow {
                background: #ffff0011;
                border-radius: 2em;
                height: 1.5em;
            }
        }
    }
}

.settings-button {
    font-size: 2em;
    position: absolute;
    bottom: 0.6em;
    left: 0.3em;
}
</style>
