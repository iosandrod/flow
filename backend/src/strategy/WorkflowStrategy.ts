import { FlowManager } from '../manager/FlowManager';
import { WorkflowData, WorkflowResponse } from '../types';

export interface WorkflowStrategy {
    execute(data: WorkflowData): Promise<WorkflowResponse>;
}

export abstract class BaseStrategy implements WorkflowStrategy {
    protected flowManager: FlowManager;

    constructor(flowManager: FlowManager) {
        this.flowManager = flowManager;
    }

    abstract execute(data: WorkflowData): Promise<WorkflowResponse>;

    protected success(data?: any, message?: string): WorkflowResponse {
        return {
            success: true,
            message,
            data
        };
    }

    protected error(message: string): WorkflowResponse {
        return {
            success: false,
            message
        };
    }
}

export class StartWorkflowStrategy extends BaseStrategy {
    async execute(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { bpmnKey, starterId, businessKey, processName, variables } = data;
            
            if (!bpmnKey || !starterId || !businessKey || !processName) {
                throw new Error('Missing required fields: bpmnKey, starterId, businessKey, processName');
            }

            const result = await this.flowManager.startWorkflow(
                bpmnKey,
                starterId,
                businessKey,
                processName,
                variables || {}
            );

            return this.success(result, 'Workflow started successfully');
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export class ApproveStrategy extends BaseStrategy {
    async execute(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { taskId, userId, comment, variables } = data;
            
            if (!taskId || !userId) {
                throw new Error('Missing required fields: taskId, userId');
            }

            // 确保 userId 是字符串
            const userIdStr = String(userId);
            
            const result = await this.flowManager.approveTask(taskId, userIdStr, comment, variables || {});

            return this.success(result, 'Task approved successfully');
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export class RejectStrategy extends BaseStrategy {
    async execute(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { taskId, userId, comment } = data;
            
            if (!taskId || !userId) {
                throw new Error('Missing required fields: taskId, userId');
            }

            // 确保 userId 是字符串
            const userIdStr = String(userId);

            const result = await this.flowManager.rejectTask(taskId, userIdStr, comment);

            return this.success(result, 'Task rejected');
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export class ExecuteStrategy extends BaseStrategy {
    async execute(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { taskId, userId, comment, variables } = data;
            
            if (!taskId || !userId) {
                throw new Error('Missing required fields: taskId, userId');
            }

            const result = await this.flowManager.executeTask(taskId, userId, comment, variables || {});

            return this.success(result, 'Task executed successfully');
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export class CloseStrategy extends BaseStrategy {
    async execute(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { processId, userId, comment } = data;
            
            if (!processId || !userId) {
                throw new Error('Missing required fields: processId, userId');
            }

            const result = await this.flowManager.closeProcess(processId, userId, comment);

            return this.success(result, 'Process closed');
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export class RevokeStrategy extends BaseStrategy {
    async execute(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { taskId, userId, comment } = data;
            
            if (!taskId || !userId) {
                throw new Error('Missing required fields: taskId, userId');
            }

            const result = await this.flowManager.revokeApproval(taskId, userId, comment);

            return this.success(result, 'Approval revoked');
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export class GetUserTasksStrategy extends BaseStrategy {
    async execute(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { _userName } = data;
            
            const tasks = await this.flowManager.getUserTasks(_userName);

            return this.success(tasks);
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export class GetProcessDetailStrategy extends BaseStrategy {
    async execute(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { processId } = data;
            
            if (!processId) {
                throw new Error('Missing required field: processId');
            }

            const detail = await this.flowManager.getProcessDetail(processId);

            return this.success(detail);
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export class GetProcessHistoryStrategy extends BaseStrategy {
    async execute(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { processId } = data;
            
            if (!processId) {
                throw new Error('Missing required field: processId');
            }

            const history = await this.flowManager.getProcessHistory(processId);

            return this.success(history);
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export class GetProcessVariablesStrategy extends BaseStrategy {
    async execute(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { processId } = data;
            
            if (!processId) {
                throw new Error('Missing required field: processId');
            }

            const variables = await this.flowManager.getProcessVariables(processId);

            return this.success(variables);
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}
