import type { App } from 'vue'
import ApprovalFlow from './ApprovalFlow.vue'
import Dashboard from './components/Dashboard.vue'
import ApprovalManager from './components/ApprovalManager.vue'
import PendingTasks from './components/PendingTasks.vue'
import MyApplications from './components/MyApplications.vue'
import FlowManager from './components/FlowManager.vue'
import SalesOrder from './components/SalesOrder.vue'
import type { ApprovalFlowOptions, User, WorkflowResponse, PageType } from './types'

export { 
  ApprovalFlow, 
  Dashboard, 
  ApprovalManager, 
  PendingTasks, 
  MyApplications,
  FlowManager,
  SalesOrder
}

export type { 
  ApprovalFlowOptions, 
  User, 
  WorkflowResponse, 
  PageType,
  Task,
  Approval,
  ApprovalHistory,
  BpmnDesign,
  WorkflowData,
  SubmitEvent,
  CompleteEvent,
  ErrorEvent,
  TaskCreatedEvent,
  StatusChangeEvent
} from './types'

function install(app: App, options: ApprovalFlowOptions) {
  app.component('ApprovalFlow', ApprovalFlow)
}

export default { install }
