<style scoped>
.project-name {
    padding-right: 2.1em;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
}

.project-name-skeleton {
    width: 85%;
    background: #747bff11;
    border-radius: 2em;
    height: 1.5em;
}
</style>
<template>
    <div style="width: 100%; height: 36.25px; box-sizing: border-box; position: relative">
        <button style="width:100%; height: 100%" @click="$emit('open-projects-page')">
            <Transition mode="out-in">
                <div v-if="projectId"
                     style="position: relative; display: flex; align-items: center; justify-items: start">
                    <div v-if="isPending" class="project-name-skeleton"/>
                    <div v-else-if="isError">Error</div>
                    <div v-else class="project-name">
                        {{
                            project.data.name === '' ? project.data.display_name : project.data.name
                        }}
                    </div>
                </div>

                <div v-else>
                    All projects
                </div>
            </Transition>
        </button>
        <button
            style="font-weight: bold; position: absolute; background: #747bff22; color: #747bff; font-size: large; padding: 0.25em 0.5em; right: 0.25em; top: 0.15em; line-height: 1em;"
            @click.stop="$emit('clear-project-choose')">
            <div style="transform: rotate(45deg)">+</div>
        </button>
    </div>
</template>

<script lang="ts" setup>
import {useQuery} from "@tanstack/vue-query";
import {getProject} from "@/api";
import {computed} from "vue";

const props = defineProps<{
    projectId: string | null | undefined
}>()

const enabled = computed(() => props.projectId !== null && props.projectId !== undefined)
const {data: project, isPending, isError} = useQuery({
    enabled,
    queryKey: ['project', props.projectId],
    queryFn: () => getProject(props.projectId)
})

const emit = defineEmits<{
    (e: 'open-projects-page'): void
    (e: 'clear-project-choose'): void
}>()
</script>
