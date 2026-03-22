export enum ProcessStatus {
    NEW = 'I',
    APPROVING = 'A',
    PARTIAL_APPROVE = 'D',
    COMPLETED = 'F',
    EXECUTING = 'G',
    REJECTED = 'N',
    CLOSED = 'C'
}

export enum TaskStatus {
    PENDING = 'P',
    ACTIVE = 'A',
    DONE = 'D',
    REJECTED = 'R'
}

export interface WorkflowRequest {
    action: string;
    data: WorkflowData;
}

export interface WorkflowData {
    processId?: string;
    bpmnKey?: string;
    businessKey?: string;
    processName?: string;
    starterId?: string;
    taskId?: string;
    nodeId?: string;
    nodeName?: string;
    assignee?: string;
    comment?: string;
    variables?: Record<string, any>;
    userId?: string;
    roleName?: string;
    _userName?: string;
    tableName?: string;
    data?: any;
    id?: string;
    status?: string;
    approver?: string;
    procInstId?: string;
}

export interface WorkflowResponse {
    success: boolean;
    message?: string;
    data?: any;
}

export interface WorkflowEvent {
    type: string;
    processId: string;
    taskId?: string;
    data?: any;
    timestamp: Date;
}
