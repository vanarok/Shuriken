<script lang="ts" setup>
import ProjectsActivator from '@/components/ProjectsActivator.vue'
import RunningTask from '@/components/RunningTask.vue'
import {useAssignTaskProject} from '@/composables/useAssignTaskProject'
import {useRunningTask} from '@/composables/useRunningTask'
import {useSettings} from '@/composables/useSettings'
import Projects from '@/views/Projects.vue'
import Settings from '@/views/Settings.vue'
import Tasks from '@/views/Tasks.vue'
import {VueQueryDevtools} from '@tanstack/vue-query-devtools'
import {computed, ref} from 'vue'

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

const {isRunning} = useRunningTask(projectId)

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
            <RunningTask v-if="isRunning" :project />
            <div v-else style="display: flex; flex-direction: column; gap: 1em">
                <div class="control-panel">
                    <Transition mode="out-in">
                        <div
                            v-if="page === 'tasks'"
                            style="display: flex; flex-direction: column; gap: 1em; width: 100%; align-items: center"
                        >
                            <ProjectsActivator
                                :projectId
                                @open-projects-page="page = 'projects'"
                                @clear-project-choose="updateProjectChoose(null)"
                            />
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
                                    <div class="value" style="width: 8em">
                                        {{ new Date(project.due_date).toLocaleDateString() }}
                                    </div>
                                </div>
                            </div>
                            <div v-if="project && project.private_notes" :title="project.private_notes" class="private-notes">
                                <strong>Private notes:</strong>
                                {{ project.private_notes }}
                            </div>
                        </div>
                        <button v-else-if="assignProjectMode" id="project-choose-activator" @click="cancelAssignProjectMode">
                            <span>Cancel</span>
                        </button>
                        <button
                            v-else-if="page === 'projects' || page === 'settings'"
                            id="project-choose-activator"
                            @click="page = 'tasks'"
                        >
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

.private-notes {
    text-overflow: ellipsis;
    min-height: 35.99px;
    width: 100%;
    max-width: 400px;
    text-align: left;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.settings-button {
    font-size: 1.3rem;
    position: absolute;
    bottom: 0.8rem;
    left: 0.1rem;
    color: #747bff66;
    transition: color 0.2s ease-in-out;

    &:hover {
        color: #747bff;
    }
}
</style>
