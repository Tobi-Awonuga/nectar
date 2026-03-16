// Re-exports workflow instance methods under the "tasks" domain name
// Tasks in the UI are workflow instances — this service is the frontend alias
export { workflowsService as tasksService } from './workflows.service'
