import { FlowManager } from '../manager/FlowManager';
import { DbAdapt } from '../db/DbAdapt';
import { workerManager } from '../engine/WorkerManager';
import { 
    WorkflowStrategy, 
    StartWorkflowStrategy, 
    ApproveStrategy, 
    RejectStrategy,
    ExecuteStrategy,
    CloseStrategy,
    RevokeStrategy,
    GetUserTasksStrategy,
    GetProcessDetailStrategy,
    GetProcessHistoryStrategy,
    GetProcessVariablesStrategy
} from './WorkflowStrategy';
import { WorkflowData, WorkflowResponse } from '../types';
import { BpmnModdle } from 'bpmn-moddle';

const bpmnModdle = new BpmnModdle();

async function ensureDiXml(xml: string): Promise<string> {
    if (xml.includes('bpmndi:')) return xml;
    
    try {
        const { rootElement } = await bpmnModdle.fromXML(xml) as any;
        const processes = rootElement.rootElements.filter((e: any) => e.$type === 'bpmn:Process');
        if (!processes.length) return xml;
        
        const process = processes[0];
        const processId = process.id;
        const elements = process.flowElements || [];
        
        let shapes = '';
        let edges = '';
        const cols = Math.ceil(Math.sqrt(elements.length));
        const startX = 100, startY = 100;
        const hGap = 180, vGap = 120;
        
        elements.forEach((el: any, idx: number) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const x = startX + col * hGap;
            const y = startY + row * vGap;
            
            if (el.$type === 'bpmn:SequenceFlow') {
                const nextCol = (idx + 1) % cols;
                const nextRow = Math.floor((idx + 1) / cols);
                edges += `<bpmndi:BPMNEdge id="${el.id}_di" bpmnElement="${el.id}"><di:waypoint x="${x}" y="${y}"/><di:waypoint x="${startX + nextCol * hGap}" y="${startY + nextRow * vGap}"/></bpmndi:BPMNEdge>`;
            } else {
                const w = el.$type.includes('Gateway') ? 50 : 100;
                const h = el.$type.includes('Gateway') ? 50 : 80;
                const isMarker = el.$type === 'bpmn:ExclusiveGateway' ? ' isMarkerVisible="true"' : '';
                shapes += `<bpmndi:BPMNShape id="${el.id}_di" bpmnElement="${el.id}"${isMarker}><dc:Bounds x="${x}" y="${y}" width="${w}" height="${h}"/></bpmndi:BPMNShape>`;
            }
        });
        
        const di = `<bpmndi:BPMNDiagram id="BPMNDiagram_1"><bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">${shapes}${edges}</bpmndi:BPMNPlane></bpmndi:BPMNDiagram>`;
        
        return xml.replace(/<\/bpmn:definitions>/i, `${di}</bpmn:definitions>`);
    } catch (e) {
        return xml;
    }
}

export class StrategyManager {
    private strategies: Map<string, WorkflowStrategy> = new Map();
    private flowManager: FlowManager;
    private dbAdapt: DbAdapt;

    constructor(flowManager: FlowManager, dbAdapt: DbAdapt) {
        this.flowManager = flowManager;
        this.dbAdapt = dbAdapt;
        this.initStrategies();
    }

    private initStrategies(): void {
        this.strategies.set('start', new StartWorkflowStrategy(this.flowManager));
        this.strategies.set('approve', new ApproveStrategy(this.flowManager));
        this.strategies.set('reject', new RejectStrategy(this.flowManager));
        this.strategies.set('execute', new ExecuteStrategy(this.flowManager));
        this.strategies.set('close', new CloseStrategy(this.flowManager));
        this.strategies.set('revoke', new RevokeStrategy(this.flowManager));
        this.strategies.set('getUserTasks', new GetUserTasksStrategy(this.flowManager));
        this.strategies.set('getProcessDetail', new GetProcessDetailStrategy(this.flowManager));
        this.strategies.set('getProcessHistory', new GetProcessHistoryStrategy(this.flowManager));
        this.strategies.set('getProcessVariables', new GetProcessVariablesStrategy(this.flowManager));
    }

    async execute(action: string, data: WorkflowData): Promise<WorkflowResponse> {
        switch (action) {
            case 'getPendingTasks':
                return this.handleGetPendingTasks(data);
            case 'completeTask':
                return this.handleCompleteTask(data);
            case 'getAllPendingTasks':
                return this.handleGetAllPendingTasks();
            case 'listMyApplications':
                return this.handleListMyApplications(data);
            case 'listApprovalHistory':
                return this.handleListApprovalHistory();
            case 'queryOrders':
                return this.handleQueryOrders(data);
            case 'createOrder':
                return this.handleCreateOrder(data);
            case 'approveOrder':
                return this.handleApproveOrder(data);
            case 'getProcessNodeStatus':
                return this.handleGetProcessNodeStatus(data);
            default:
                const strategy = this.strategies.get(action);
                if (!strategy) {
                    return {
                        success: false,
                        message: `Unknown action: ${action}`
                    };
                }
                return strategy.execute(data);
        }
    }

    private async handleGetAllPendingTasks(): Promise<WorkflowResponse> {
        try {
            const tasks = await this.dbAdapt.getAllPendingTasks();
            return { success: true, data: tasks };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    private async handleGetPendingTasks(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            console.log('[Strategy] Full data received:', JSON.stringify(data));
            const { _userName } = data;
            console.log('[Strategy] Extracted params:', { _userName });
            
            const tasks = await this.dbAdapt.getUserTasks(_userName);
            
            return { success: true, data: tasks };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    private async handleListMyApplications(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { userId } = data;
            if (!userId) {
                return { success: false, message: 'Missing userId' };
            }
            
            const approvals = await this.dbAdapt.listBizApprovals(userId);
            
            return { success: true, data: approvals };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    private async handleListApprovalHistory(): Promise<WorkflowResponse> {
        try {
            const history = await this.dbAdapt.listApprovalHistory();
            
            return { success: true, data: history };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    private async handleQueryOrders(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { tableName } = data;
            if (!tableName) {
                return { success: false, message: 'Missing tableName' };
            }
            
            const orders = await this.dbAdapt.queryByTable(tableName);
            return { success: true, data: orders };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    private async handleCreateOrder(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { tableName, data: orderData } = data;
            if (!tableName) {
                return { success: false, message: 'Missing tableName' };
            }
            
            const orderNo = `${tableName.replace('t_', '')}_${Date.now()}`;
            const id = await this.dbAdapt.insert(tableName, {
                ...orderData,
                orderNo,
                createTime: new Date().toISOString()
            });
            
            return { success: true, data: { id, orderNo } };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    private async handleApproveOrder(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { id, tableName, status, approver } = data;
            if (!id || !tableName) {
                return { success: false, message: 'Missing required fields' };
            }
            
            await this.dbAdapt.updateById(tableName, id, {
                status,
                approver,
                updateTime: new Date().toISOString()
            });
            
            return { success: true, message: '审批成功' };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    private async handleGetProcessNodeStatus(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { procInstId } = data;
            if (!procInstId) {
                return { success: false, message: 'Missing procInstId' };
            }
            
            const pendingTasks = await this.dbAdapt.getPendingTasks(procInstId);
            const pending = pendingTasks
                .filter((t: any) => !t.END_TIME_)
                .map((t: any) => t.TASK_DEF_KEY_);
            
            const history = await this.dbAdapt.getProcessHistory(procInstId);
            const completed = history
                .filter((h: any) => h.END_TIME_ && h.DELETE_REASON_ === 'approve')
                .map((h: any) => h.TASK_DEF_KEY_);
            
            const rejected = history
                .filter((h: any) => h.END_TIME_ && h.DELETE_REASON_ === 'reject')
                .map((h: any) => h.TASK_DEF_KEY_);
            
            return {
                success: true,
                data: { pending, completed, rejected }
            };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    private async handleCompleteTask(data: WorkflowData): Promise<WorkflowResponse> {
        try {
            const { taskId, userId, comment, variables } = data;
            
            if (!taskId || !userId) {
                return { success: false, message: 'Missing required fields: taskId, userId' };
            }

            const result = await workerManager.completePendingTask(taskId, userId, comment, variables);

            return { 
                success: true, 
                data: result,
                message: 'Task completed successfully'
            };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async executeBpmnCrud(action: string, data: any): Promise<WorkflowResponse> {
        try {
            switch (action) {
                case 'createBpmn':
                    const design = await this.dbAdapt.createFlowDesign({
                        ID_: data.bpmnKey,
                        NAME_: data.name,
                        BPMN_XML_: data.bpmnXml,
                        CREATE_USER_: data._userId || 'system',
                        UPDATE_USER_: data._userId || 'system'
                    });
                    return { success: true, data: this.formatFlowDesign(design) };

                case 'listBpmn':
                    const bpmnList = await this.dbAdapt.listFlowDesigns();
                    return { 
                        success: true, 
                        data: bpmnList?.map((b: any) => this.formatFlowDesign(b))||[]
                    };

                case 'getBpmn':
                    const bpmnDetail = await this.dbAdapt.getFlowDesignByKey(data.bpmnKey);
                    if (bpmnDetail) {
                        const formatted = this.formatFlowDesign(bpmnDetail);
                        if (formatted.bpmnXml) {
                            formatted.bpmnXml = await ensureDiXml(formatted.bpmnXml);
                        }
                        return { success: true, data: formatted };
                    }
                    return { success: false, message: 'BPMN not found' };

                case 'updateBpmn':
                    const updated = await this.dbAdapt.updateFlowDesign(data.id, {
                        NAME_: data.name,
                        BPMN_XML_: data.bpmnXml,
                        UPDATE_USER_: data._userId || 'system'
                    });
                    return { success: true, data: updated ? this.formatFlowDesign(updated) : null };

                case 'deleteBpmn':
                    await this.dbAdapt.deleteFlowDesign(data.id);
                    return { success: true, message: 'BPMN deleted' };

                case 'listApprovals':
                    const approvals = await this.flowManager.listApprovals(data.userId);
                    return { success: true, data: approvals };

                default:
                    return { success: false, message: `Unknown BPMN action: ${action}` };
            }
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    private formatFlowDesign(b: any) {
        return {
            id: b.ID_,
            name: b.NAME_,
            bpmnKey: b.ID_,
            bpmnXml: b.BPMN_XML_,
            status: b.STATUS_,
            version: b.VERSION_,
            createTime: b.CREATE_TIME_,
            updateTime: b.UPDATE_TIME_
        };
    }
}
