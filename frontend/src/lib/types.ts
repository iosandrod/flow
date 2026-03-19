// 审批流程库类型定义

export interface User {
  id: string
  name: string
  username?: string
  roleName?: string
  avatarColor?: string
}

export interface WorkflowData {
  bpmnKey?: string
  starterId?: string
  businessKey?: string
  processName?: string
  variables?: Record<string, any>
}

export interface Task {
  ID_: string
  PROC_INST_ID_: string
  PROC_DEF_KEY_?: string
  TASK_DEF_KEY_?: string
  NAME_?: string
  DESCRIPTION_?: string
  ASSIGNEE_?: string
  START_TIME_?: string
  END_TIME_?: string
  PRIORITY_?: number
}

export interface Approval {
  ID_: string
  TITLE_: string
  BUSINESS_TYPE_: string
  BUSINESS_KEY_?: string
  STATUS_: string
  PROC_INST_ID_: string
  CURRENT_NODE_?: string
  CURRENT_ASSIGNEE_?: string
  APPLICANT_: string
  APPLICANT_NAME_?: string
  FORM_DATA_?: string
  CREATE_TIME_?: string
  UPDATE_TIME_?: string
}

export interface ApprovalHistory {
  ID_: string
  APPROVAL_ID_: string
  PROC_INST_ID_: string
  TASK_ID_?: string
  TASK_NAME_?: string
  TASK_DEF_KEY_?: string
  ASSIGNEE_?: string
  ASSIGNEE_NAME_?: string
  ACTION_: string
  COMMENT_?: string
  CREATE_TIME_?: string
}

export interface BpmnDesign {
  id: string
  name: string
  bpmnKey: string
  bpmnXml: string
  status?: string
  version?: number
  createTime?: string
}

export interface WorkflowResponse {
  success: boolean
  message?: string
  data?: any
}

// 页面类型
export type PageType = 'dashboard' | 'pending' | 'myApply' | 'start' | 'flowManage' | 'approvalDesigner' | 'salesOrder'

// 组件选项
export interface ApprovalFlowOptions {
  // 必需
  apiRequest: (action: string, data: any) => Promise<WorkflowResponse>
  currentUser: User
  
  // 可选
  theme?: 'light' | 'dark'
  debug?: boolean
  defaultPage?: PageType
}

// 事件Payload
export interface SubmitEvent {
  action: string
  data: any
}

export interface CompleteEvent {
  taskId: string
  result: any
}

export interface ErrorEvent {
  code: string
  message: string
}

export interface TaskCreatedEvent {
  task: Task
}

export interface StatusChangeEvent {
  status: string
  approval?: Approval
}
