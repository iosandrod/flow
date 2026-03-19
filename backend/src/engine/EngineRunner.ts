import { ZBClient } from 'zeebe-node';

export interface EngineExecution {
    id: string;
    status: string;
    variables: Record<string, any>;
}

export class EngineRunner {
    private zbClient: ZBClient | null = null;
    private bpmnProcessId: string = '';
    private gatewayAddress: string;

    constructor(gatewayAddress: string = process.env.ZEEBE_ADDRESS || 'localhost:26500') {
        this.gatewayAddress = gatewayAddress;
    }

    async connect(): Promise<void> {
        if (!this.zbClient) {
            this.zbClient = new ZBClient(this.gatewayAddress, {
                longPoll: 60000,
                pollInterval: 500,
                connectionTolerance: 30000
            });
        }
    }

    async deployProcess(bpmnXml: string, processId?: string): Promise<{
        key: string;
        id: string;
        bpmnProcessId: string;
    }> {
        await this.connect();

        try {
            const cleanXml = bpmnXml
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // 移除控制字符
                .replace(/[^\x20-\x7E\n\r\t]/g, ' ');  // 将非ASCII替换为空格
            console.log('[EngineRunner] Deploying BPMN, cleanXml length:', cleanXml.length);
            
            const deploy = await this.zbClient!.deployResource({
                name: `${processId || 'process'}.bpmn`,
                process: Buffer.from(cleanXml, 'utf-8'),
            }) as any;

            console.log('Deployed to Zeebe:', deploy);
            let process: {
                bpmnProcessId: string, processDefinitionKey: string, resourceName: string, tenantId: string, version: number
            } = deploy.deployments?.[0]?.process
            let bpmnProcessId = process.bpmnProcessId
            if (deploy.processes && deploy.processes.length > 0) {
                bpmnProcessId = deploy.processes[0].bpmnProcessId;
            }

            this.bpmnProcessId = bpmnProcessId;
            return { key: bpmnProcessId, id: deploy.key, bpmnProcessId };
        } catch (error: any) {
            console.error('Error deploying process to Zeebe:', error);
            throw error;
        }
    }

    async createProcessInstance(bpmnProcessId: string, variables: Record<string, any> = {}): Promise<string> {
        await this.connect();

        const cleanVariables: Record<string, any> = {};
        for (const [key, value] of Object.entries(variables)) {
            if (typeof value === 'string') {
                cleanVariables[key] = value.replace(/[^\x20-\x7E\u4E00-\u9FA5]/g, '');
            } else {
                cleanVariables[key] = value;
            }
        }
        console.log('[EngineRunner] createProcessInstance bpmnProcessId:', bpmnProcessId);
        console.log('[EngineRunner] cleanVariables:', JSON.stringify(cleanVariables));
        
        try {
            const result = await this.zbClient!.createProcessInstance({
                bpmnProcessId: bpmnProcessId,
                variables: cleanVariables
            });
            return String(result.processInstanceKey);
        } catch (error: any) {
            console.error('[EngineRunner] Error creating process instance:', error);
            throw error;
        }
    }

    async _debugDeployAndCreate(bpmnXml: string, variables: Record<string, any>): Promise<void> {
        await this.connect();
        const cleanXml = bpmnXml
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        const deploy = await this.zbClient!.deployResource({
            name: 'debug.bpmn',
            process: Buffer.from(cleanXml, 'utf-8'),
        }) as any;
        console.log('[DEBUG] Deploy result:', JSON.stringify(deploy));
        const bpmnProcessId = deploy.deployments?.[0]?.process?.bpmnProcessId || deploy.processes?.[0]?.bpmnProcessId;
        console.log('[DEBUG] bpmnProcessId:', bpmnProcessId);
        const cleanVariables: Record<string, any> = {};
        for (const [key, value] of Object.entries(variables)) {
            if (typeof value === 'string') {
                cleanVariables[key] = value.replace(/[^\x20-\x7E\u4E00-\u9FA5]/g, '');
            } else {
                cleanVariables[key] = value;
            }
        }
        console.log('[DEBUG] cleanVariables:', JSON.stringify(cleanVariables));
        const result = await this.zbClient!.createProcessInstance({
            bpmnProcessId,
            variables: cleanVariables
        });
        console.log('[DEBUG] createProcessInstance result:', result);
    }

    async cancelProcessInstance(processInstanceKey: string): Promise<void> {
        await this.connect();

        try {
            await this.zbClient!.cancelProcessInstance(parseInt(processInstanceKey));
        } catch (error: any) {
            console.error('Error canceling process instance:', error);
        }
    }

    /**
     * 根据businessKey取消已存在的流程实例
     * 使用activateJobs来查找并处理相关的Jobs
     */
    async cancelProcessInstanceByBusinessKey(bpmnProcessId: string, businessKey: string): Promise<void> {
        console.log(`[Engine] Checking for existing process instance with businessKey: ${businessKey}`);
        // 由于zeebe-node没有直接的searchProcessInstances方法，
        // 这里我们依赖前端传入唯一的businessKey来避免重复发起
        // 如果需要严格处理，可以在数据库中查询并记录procInstId
    }

    /**
     * 取消指定流程的所有活跃实例
     * 由于没有直接的search方法，这里不做实现
     */
    async cancelAllProcessInstances(bpmnProcessId: string): Promise<number> {
        console.log(`[Engine] cancelAllProcessInstances not fully implemented for ${bpmnProcessId}`);
        return 0;
    }

    getClient(): ZBClient | null {
        return this.zbClient;
    }

    getBpmnProcessId(): string {
        return this.bpmnProcessId;
    }
}
