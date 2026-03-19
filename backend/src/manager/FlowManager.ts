import { DbAdapt } from '../db/DbAdapt';
import { bpmnParser } from '../utils/BpmnParser';
import { ProcessStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { EngineRunner } from '../engine/EngineRunner';
import { workerManager } from '../engine/WorkerManager';

export interface WorkflowNode {
    id: string;
    name: string;
    type: string;
    assignee?: string;
    role?: string;
}

export class FlowManager {
    private dbAdapt: DbAdapt;
    private engineRunners: Map<string, EngineRunner> = new Map();

    constructor(dbAdapt: DbAdapt) {
        this.dbAdapt = dbAdapt;
    }
    
    private toLowerCase(str: string): string {
        return String(str).toLowerCase();
    }

    /**
     * 发起审批流程
     * 
     * 流程：
     * 1. 获取流程定义（BPMN XML）
     * 2. 部署BPMN到Zeebe引擎
     * 3. 创建流程实例
     * 4. Zeebe自动执行到ServiceTask节点
     * 5. Worker监听到达的任务，创建待办（自动触发）
     * 
     * @param bpmnKey 流程定义key
     * @param starterId 申请人ID
     * @param businessKey 业务Key
     * @param processName 流程名称
     * @param variables 流程变量
     */
    async startWorkflow(bpmnKey: string, starterId: string, businessKey: string, processName: string, variables: Record<string, any> = {}): Promise<any> {
        // ========== 步骤0: 清理已存在的流程实例（避免重复发起） ==========
        const engine = new EngineRunner();
        if (businessKey) {
            await engine.cancelProcessInstanceByBusinessKey(bpmnKey, businessKey);
        }

        // ========== 步骤1: 获取流程定义 ==========
        const flowDesign = await this.dbAdapt.getFlowDesignByKey(bpmnKey);
        if (!flowDesign) {
            throw new Error(`Flow design not found: ${bpmnKey}`);
        }
        if (!flowDesign.BPMN_XML_) {
            throw new Error(`Flow design BPMN XML is empty: ${bpmnKey}`);
        }

        // 获取申请人姓名
        const starterName = variables._starterName || variables.applicant || '';

        let approval = null as any;

        try {
            // ========== 步骤2: 创建审批记录（先创建审批，获取ID） ==========
            approval = await this.dbAdapt.createBizApproval({
                TITLE_: processName,
                APPLICANT_: starterId,
                APPLICANT_NAME_: starterName,
                BUSINESS_TYPE_: bpmnKey,
                PROC_INST_ID_: '',
                CURRENT_NODE_: 'start',
                CURRENT_ASSIGNEE_: '',
                FORM_DATA_: JSON.stringify(variables)
            });

            // ========== 步骤3: 部署BPMN到Zeebe ==========
            const deployResult = await engine.deployProcess(flowDesign.BPMN_XML_, bpmnKey);

            // ========== 步骤4: 解析BPMN，获取任务类型并创建Worker ==========
            const tasks = await bpmnParser.extractAllTasks(flowDesign.BPMN_XML_);
            console.log(`[startWorkflow] Found ${tasks.length} task types: ${tasks.map(t => t.taskType).join(', ')}`);
            
            // 连接 Zeebe 并创建 Worker
            await workerManager.connect();
            for (const task of tasks) {
                if (task.taskType) {
                    workerManager.createWorkerForTaskType(task.taskType, bpmnKey);
                }
            }

            // ========== 步骤5: 创建流程实例 ==========
            // Zeebe会自动执行到第一个ServiceTask节点
            // 将审批ID贯穿整个流程
            const instanceKey = await engine.createProcessInstance(deployResult.bpmnProcessId, {
                ...variables,
                businessKey,
                starterId,
                approvalId: approval.ID_
            });

            // ========== 步骤6: 更新审批记录的流程实例ID ==========
            await this.dbAdapt.updateBizApproval(approval.ID_, {
                PROC_INST_ID_: instanceKey
            });

            // ========== 返回结果 ==========
            // 待办任务由Worker自动创建，不需要手动创建
            return {
                approvalId: approval.ID_,
                procInstId: instanceKey,
                status: ProcessStatus.NEW,
                message: 'Workflow started, waiting for worker to create task'
            };
        } catch (error: any) {
            console.error('[FlowManager] Failed to start workflow:', error);
            return {
                approvalId: approval?.ID_,
                procInstId: null,
                status: ProcessStatus.NEW,
                message: 'Workflow started (Zeebe error: ' + error.message + ')'
            };
        }
    }

    private async createTaskForNode(procInstId: string, processKey: string, node: WorkflowNode, bpmnXml: string): Promise<void> {
        const assignments = await bpmnParser.extractTaskAssignments(bpmnXml);
        const assignment = assignments.find(a => a.nodeId === node.id);

        const execution = await this.dbAdapt.getExecutionByProcInstId(procInstId);

        let customHeadersJson: string | undefined;
        const customHeaders: Record<string, string> = {};
        if (assignment?.assignee) {
            customHeaders.user = assignment.assignee;
        } else if (assignment?.role) {
            customHeaders.user = assignment.role;
        }
        if (Object.keys(customHeaders).length > 0) {
            customHeadersJson = JSON.stringify(customHeaders);
        }

        const task = await this.dbAdapt.createTask({
            PROC_INST_ID_: procInstId,
            PROC_DEF_ID_: processKey,
            PROC_DEF_KEY_: processKey,
            TASK_DEF_KEY_: node.id,
            NAME_: node.name || node.id,
            DESCRIPTION_: node.name,
            ASSIGNEE_: assignment?.assignee || assignment?.role || '',
            EXECUTION_ID_: execution?.ID_,
            CUSTOM_HEADERS_: customHeadersJson
        });

        // 缓存任务到 workerManager，用于后续审批时能正确处理
        // 手动创建的任务标记为 _manual: true，审批时不调用 job.complete()
        (workerManager as any).pendingTasks?.set(task.ID_, {
            job: { key: null, variables: {}, complete: async () => {} },
            procInstId: procInstId,
            taskType: node.id,
            nodeId: node.id,
            _manual: true
        });
    }

    async approveTask(taskId: string, userId: string, comment?: string, variables: Record<string, any> = {}): Promise<any> {
        const task = await this.dbAdapt.getTask(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        const approval = (task as any).APPROVAL_ID_
            ? await this.dbAdapt.getBizApproval((task as any).APPROVAL_ID_)
            : await this.dbAdapt.getBizApprovalByProcInstId(task.PROC_INST_ID_);
        if (!approval) {
            throw new Error(`Approval not found`);
        }

        const taskComplete = await this.dbAdapt.completeTask(taskId, {
            ASSIGNEE_: userId
        });

        await this.dbAdapt.addTaskHistory({
            PROC_INST_ID_: task.PROC_INST_ID_,
            PROC_DEF_KEY_: task.PROC_DEF_KEY_,
            TASK_DEF_KEY_: task.TASK_DEF_KEY_,
            NAME_: task.NAME_,
            ASSIGNEE_: userId,
            DELETE_REASON_: 'approve',
            END_TIME_: new Date().toISOString()
        });

        await this.dbAdapt.addApprovalHistory({
            APPROVAL_ID_: approval.ID_,
            PROC_INST_ID_: task.PROC_INST_ID_,
            TASK_ID_: taskId,
            TASK_NAME_: task.NAME_,
            TASK_DEF_KEY_: task.TASK_DEF_KEY_,
            ASSIGNEE_: userId,
            ACTION_: 'approve',
            COMMENT_: comment
        });

        const flowDesign = await this.dbAdapt.getFlowDesignByKey(approval.BUSINESS_TYPE_);
        if (!flowDesign?.BPMN_XML_) {
            throw new Error('Flow design not found');
        }

        const flowVariables = JSON.parse(approval.FORM_DATA_ || '{}');
        const updatedFormData = { ...flowVariables, ...variables };
        
        // 调用 workerManager.completePendingTask 推进 Zeebe 流程
        // 任务由 Worker 监听自动创建，不需要手动创建
        const workerResult = await workerManager.completePendingTask(taskId, userId, comment, updatedFormData);
        console.log('[approveTask] Worker complete result:', JSON.stringify(workerResult));

        // 检查是否还有待处理的任务（由 Worker 自动创建）
        const remainingTasks = await this.dbAdapt.getPendingTasks(task.PROC_INST_ID_);
        const hasMoreTasks = remainingTasks.length > 0;
        const newStatus = hasMoreTasks ? ProcessStatus.APPROVING : ProcessStatus.COMPLETED;
        
        await this.dbAdapt.updateBizApproval(approval.ID_, {
            STATUS_: newStatus,
            CURRENT_NODE_: hasMoreTasks ? 'pending' : 'completed',
            CURRENT_ASSIGNEE_: userId,
            FORM_DATA_: JSON.stringify(updatedFormData)
        });

        return {
            approvalId: approval.ID_,
            procInstId: task.PROC_INST_ID_,
            status: newStatus,
            completedTask: taskId,
            message: hasMoreTasks ? 'Approved, waiting for next task' : 'Workflow completed'
        };
    }

    async rejectTask(taskId: string, userId: string, comment?: string): Promise<any> {
        const task = await this.dbAdapt.getTask(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        const approval = (task as any).APPROVAL_ID_
            ? await this.dbAdapt.getBizApproval((task as any).APPROVAL_ID_)
            : await this.dbAdapt.getBizApprovalByProcInstId(task.PROC_INST_ID_);
        if (!approval) {
            throw new Error(`Approval not found`);
        }

        await this.dbAdapt.completeTask(taskId, {
            ASSIGNEE_: userId
        });

        await this.dbAdapt.addTaskHistory({
            PROC_INST_ID_: task.PROC_INST_ID_,
            PROC_DEF_KEY_: task.PROC_DEF_KEY_,
            TASK_DEF_KEY_: task.TASK_DEF_KEY_,
            NAME_: task.NAME_,
            ASSIGNEE_: userId,
            DELETE_REASON_: 'reject',
            END_TIME_: new Date().toISOString()
        });

        await this.dbAdapt.addApprovalHistory({
            APPROVAL_ID_: approval.ID_,
            PROC_INST_ID_: task.PROC_INST_ID_,
            TASK_ID_: taskId,
            TASK_NAME_: task.NAME_,
            TASK_DEF_KEY_: task.TASK_DEF_KEY_,
            ASSIGNEE_: userId,
            ACTION_: 'reject',
            COMMENT_: comment
        });

        await this.dbAdapt.updateBizApproval(approval.ID_, {
            STATUS_: ProcessStatus.REJECTED,
            CURRENT_NODE_: 'rejected',
            CURRENT_ASSIGNEE_: userId
        });

        await this.dbAdapt.completeExecution(task.PROC_INST_ID_);

        return {
            approvalId: approval.ID_,
            procInstId: task.PROC_INST_ID_,
            status: ProcessStatus.REJECTED,
            message: 'Workflow rejected'
        };
    }

    async executeTask(taskId: string, userId: string, comment?: string, variables: Record<string, any> = {}): Promise<any> {
        return this.approveTask(taskId, userId, comment, variables);
    }

    async closeProcess(processId: string, userId: string, comment?: string): Promise<any> {
        const approval = await this.dbAdapt.getBizApproval(processId);
        if (!approval) {
            throw new Error(`Approval not found: ${processId}`);
        }

        const pendingTasks = await this.dbAdapt.getPendingTasks(approval.PROC_INST_ID_);
        for (const task of pendingTasks) {
            await this.dbAdapt.completeTask(task.ID_, {
                ASSIGNEE_: userId
            });

            await this.dbAdapt.addTaskHistory({
                PROC_INST_ID_: approval.PROC_INST_ID_,
                PROC_DEF_KEY_: task.PROC_DEF_KEY_,
                TASK_DEF_KEY_: task.TASK_DEF_KEY_,
                NAME_: task.NAME_,
                ASSIGNEE_: userId,
                DELETE_REASON_: 'close',
                END_TIME_: new Date().toISOString()
            });
        }

        await this.dbAdapt.updateBizApproval(processId, {
            STATUS_: ProcessStatus.CLOSED
        });

        await this.dbAdapt.addApprovalHistory({
            APPROVAL_ID_: approval.ID_,
            PROC_INST_ID_: approval.PROC_INST_ID_,
            ASSIGNEE_: userId,
            ACTION_: 'close',
            COMMENT_: comment
        });

        await this.dbAdapt.completeExecution(approval.PROC_INST_ID_);

        return {
            approvalId: approval.ID_,
            procInstId: approval.PROC_INST_ID_,
            status: ProcessStatus.CLOSED,
            message: 'Process closed'
        };
    }

    async revokeApproval(taskId: string, userId: string, comment?: string): Promise<any> {
        throw new Error('Revoke approval not yet implemented');
    }

    async getProcessDetail(processId: string): Promise<any> {
        const approval = await this.dbAdapt.getBizApproval(processId);
        if (!approval) {
            throw new Error(`Approval not found: ${processId}`);
        }

        const tasks = await this.dbAdapt.getAllTasksByProcess(approval.PROC_INST_ID_);
        const history = await this.dbAdapt.getApprovalHistory(processId);

        return {
            approval,
            tasks,
            history,
            variables: approval.FORM_DATA_ ? JSON.parse(approval.FORM_DATA_) : {}
        };
    }

    async getUserTasks(userName?: string): Promise<any[]> {
        return this.dbAdapt.getUserTasks(userName);
    }

    async getProcessHistory(processId: string): Promise<any[]> {
        const approval = await this.dbAdapt.getBizApproval(processId);
        if (!approval) {
            return [];
        }
        return this.dbAdapt.getProcessHistory(approval.PROC_INST_ID_);
    }

    async getProcessVariables(processId: string): Promise<Record<string, any>> {
        const approval = await this.dbAdapt.getBizApproval(processId);
        if (!approval || !approval.FORM_DATA_) {
            return {};
        }
        try {
            return JSON.parse(approval.FORM_DATA_);
        } catch {
            return {};
        }
    }

    async listApprovals(userId?: string): Promise<any[]> {
        return this.dbAdapt.listBizApprovals(userId);
    }
}
