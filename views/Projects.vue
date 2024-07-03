<script lang="ts" setup>
import {useQuery} from "@tanstack/vue-query";
import {getProjects} from "@/api";

const emit = defineEmits(['project-choose'])

const {data: projects, isPending} = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects
})
</script>

<template>
    <div>
        <h3>Recents projects</h3>
        <Transition mode="out-in">
            <div v-if="isPending">
                <div v-for="skeleton in 10" class="project">
                    <div class="project-text-skeleton"></div>
                </div>
            </div>
            <div v-else style="display: flex; flex-direction: column; align-items: center">
                <button v-for="project in projects.data" class="project" @click="emit('project-choose', project)">
                    <div class="project-text">
                        {{ project.name === '' ? project.display_name : project.name }}
                    </div>
                </button>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.project {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2em;
    border: none;
    background: none;
    height: 5em;
    width: 100%;
    border-radius: 0;
    border-bottom: 1px solid #747bff22;
    transition: background 0.25s;
}

.project:hover {
    background: #747bff11;
}

.project-text {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 3;
    display: -webkit-box;
    -webkit-box-orient: vertical;
}

.project-text-skeleton {
    background: #747bff11;
    border-radius: 2em;
    width: 100%;
    height: 1.5em;
}
</style>
