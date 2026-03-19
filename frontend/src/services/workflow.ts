const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export interface WorkflowResponse {
  success: boolean
  message?: string
  data?: any
}

export interface BizApproval {
  ID_: string
  TITLE_: string
  AMOUNT_?: number
  APPLICANT_: string
  APPLICANT_NAME_: string
  BUSINESS_TYPE_: string
  DESCRIPTION_?: string
  STATUS_: string
  PROC_INST_ID_: string
  CURRENT_NODE_: string
  CURRENT_ASSIGNEE_: string
  FORM_DATA_?: string
  CREATE_TIME_?: string
  UPDATE_TIME_?: string
}

export interface BizApprovalHistory {
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

export interface BizFlowDesign {
  ID_: string
  NAME_: string
  DESCRIPTION_?: string
  BPMN_XML_: string
  STATUS_: string
  VERSION_?: number
  CREATE_USER_?: string
  CREATE_TIME_?: string
  UPDATE_USER_?: string
  UPDATE_TIME_?: string
}

export interface RuTask {
  ID_: string
  REV_?: number
  EXECUTION_ID_?: string
  PROC_INST_ID_: string
  PROC_DEF_ID_?: string
  PROC_DEF_KEY_?: string
  TASK_DEF_ID_?: string
  TASK_DEF_KEY_?: string
  NAME_?: string
  PARENT_TASK_ID_?: string
  DESCRIPTION_?: string
  OWNER_?: string
  ASSIGNEE_?: string
  START_TIME_?: string
  END_TIME_?: string
  DURATION_?: number
  PRIORITY_?: number
  DUE_DATE_?: string
  CATEGORY_?: string
  SUSPENSION_STATE_?: number
  TENANT_ID_?: string
  FORM_KEY_?: string
  TASK_KEY_?: string
}

export interface StartWorkflowData {
  bpmnKey: string
  starterId: string
  businessKey: string
  processName: string
  variables?: Record<string, any>
}

export interface ApproveData {
  taskId: string
  userId: string
  comment?: string
  variables?: Record<string, any>
}

export interface RejectData {
  taskId: string
  userId: string
  comment?: string
}

export interface ProcessDetail {
  approval: BizApproval
  tasks: RuTask[]
  history: BizApprovalHistory[]
  variables: Record<string, any>
}

export interface MockUser {
  User_Id: string
  UserName: string
  UserTrueName?: string
  RoleName?: string
  DeptName?: string
  avatarColor: string
}

const statusMap: Record<string, string> = {
  I: '新单',
  A: '审核中',
  D: '部分审核',
  F: '已完成',
  G: '执行中',
  N: '已拒绝',
  C: '已关闭',
  NEW: '新单',
  APPROVING: '审核中',
  COMPLETED: '已完成',
  REJECTED: '已拒绝',
  CLOSED: '已关闭'
}

const taskStatusMap: Record<string, string> = {
  P: '待处理',
  C: '已完成',
  X: '已取消'
}

export function getStatusText(status: string): string {
  return statusMap[status] || status
}

export function getTaskStatusText(status: string): string {
  return taskStatusMap[status] || status
}

export function getCurrentUser(): MockUser | null {
  const saved = localStorage.getItem('mockUser')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  }
  return null
}

export function initDefaultUser() {
  let user = getCurrentUser()
  if (!user) {
    user = {
      User_Id: 'admin001',
      UserName: 'admin',
      UserTrueName: '系统管理员',
      RoleName: '管理员',
      DeptName: 'IT部',
      avatarColor: '#18a058'
    }
    localStorage.setItem('mockUser', JSON.stringify(user))
  }
  return user
}

initDefaultUser()

async function request(action: string, data: any): Promise<WorkflowResponse> {
  const user = getCurrentUser()
  const response = await fetch(`${API_BASE_URL}/workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      data: {
        ...data,
        _userId: user?.User_Id,
        _userName: user?.UserName,
        _userTrueName: user?.UserTrueName,
        _roleName: user?.RoleName
      }
    })
  })
  return response.json()
}

export const workflowApi = {
  async startWorkflow(data: StartWorkflowData): Promise<WorkflowResponse> {
    return request('start', data)
  },

  async approveTask(data: ApproveData): Promise<WorkflowResponse> {
    return request('approve', data)
  },

  async rejectTask(data: RejectData): Promise<WorkflowResponse> {
    return request('reject', data)
  },

  async executeTask(data: ApproveData): Promise<WorkflowResponse> {
    return request('execute', data)
  },

  async closeProcess(processId: string, userId: string, comment?: string): Promise<WorkflowResponse> {
    return request('close', { processId, userId, comment })
  },

  async getUserTasks(userId: string, roleName?: string): Promise<WorkflowResponse> {
    return request('getUserTasks', { userId, roleName })
  },

  async getProcessDetail(processId: string): Promise<WorkflowResponse> {
    return request('getProcessDetail', { processId })
  },

  async getProcessHistory(processId: string): Promise<WorkflowResponse> {
    return request('getProcessHistory', { processId })
  },

  async listBpmn(): Promise<WorkflowResponse> {
    return request('listBpmn', {})
  },

  async getBpmn(bpmnKey: string): Promise<WorkflowResponse> {
    return request('getBpmn', { bpmnKey })
  },

  async createBpmn(name: string, bpmnKey: string, bpmnXml: string): Promise<WorkflowResponse> {
    return request('createBpmn', { name, bpmnKey, bpmnXml })
  },

  async updateBpmn(id: string, name: string, bpmnXml: string): Promise<WorkflowResponse> {
    return request('updateBpmn', { id, name, bpmnXml })
  },

  async deleteBpmn(id: string): Promise<WorkflowResponse> {
    return request('deleteBpmn', { id })
  }
}
