import axios from 'axios'

export const api = axios.create({
    baseURL: localStorage.getItem('invoiceNinjaURL') || '',
    headers: {
        'x-api-token': localStorage.getItem('invoiceNinjaAPIToken')
    }
})

api.interceptors.response.use((response) => {
    return response.data
})

export const getClients = () => api.get('/clients?per_page=6&page=1?status=active&without_deleted=true&sort=number|desc')

export const getProjects = () => api.get('/projects?per_page=6&page=1?&status=active&without_deleted_clients=true&sort=budgeted_hours|desc')
export const getProject = (id: string) => api.get(`/projects/${id}`)

export const getTasks = ({
    clientId,
    projectId,
    taskStatusId,
    filter
}: {
    clientId?: string
    projectId: string | null
    taskStatusId?: string
    filter?: string
}) =>
    api.get(`/tasks?without_deleted_clients=true&sort=number|desc&per_page=60&page=1&client_status=uninvoiced&status=active`, {
        params: {
            project_tasks: projectId,
            client_id: clientId,
            task_status: taskStatusId,
            filter
        }
    })
export const getTask = (id: string) => api.get(`/tasks/${id}`)
export const putTask = (
    id: string,
    {
        action,
        data
    }: {
        action?: string
        data?: any
    }
) =>
    api.put(`/tasks/${id}`, data, {
        params: {
            ...(action && {[action]: true})
        }
    })
export const postTask = ({description, projectId}: {description: string; projectId: string}) =>
    api.post(`/tasks`, {description, project_id: projectId})
export const deleteTask = (id: string) => api.delete(`/tasks/${id}`)

export const getTaskStatuses = () => api.get('/task_statuses')
export const addTaskStatus = (data: {name: string; color: string; task_status_order: number}) => api.post('/task_statuses', data)
