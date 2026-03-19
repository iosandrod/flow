const { BpmnModdle } = require("bpmn-moddle");

export interface BpmnNode {
    id: string;
    name: string;
    type: string;
    incoming: string[];
    outgoing: string[];
}

export interface BpmnEdge {
    id: string;
    source: string;
    target: string;
    conditionExpression?: string;  // 条件表达式，如 "=amount < 10000"
}

export interface BpmnGraph {
    nodes: BpmnNode[];
    edges: BpmnEdge[];
    startNodes: string[];
    endNodes: string[];
    approvalNodes: string[];
}

export interface TaskAssignment {
    nodeId: string;
    role?: string;
    assignee?: string;
    taskDefinitionType?: string;
}

export interface ServiceTaskInfo {
    nodeId: string;
    name: string;
    taskType: string;
    role?: string;       // 角色，如"部门经理"
    assignee?: string;  // 指定人，如"manager001"
}

export interface BpmnGraph {
    nodes: BpmnNode[];
    edges: BpmnEdge[];
    startNodes: string[];
    endNodes: string[];
    approvalNodes: string[];
}

export class BpmnParser {

    private moddle = new BpmnModdle();

    private toLowerCase(str: string): string {
        return String(str).toLowerCase();
    }

    async parse(xml: string): Promise<BpmnGraph> {

        const { rootElement }: any = await this.moddle.fromXML(xml);

        const process = rootElement.rootElements.find(
            (e: any) => this.toLowerCase(e.$type) === "bpmn:process"
        );

        if (!process) {
            throw new Error("No BPMN process found");
        }

        const nodes: BpmnNode[] = [];
        const edges: BpmnEdge[] = [];

        for (const element of process.flowElements) {

            if (this.toLowerCase(element.$type) === "bpmn:sequenceflow") {

                // 处理conditionExpression，可能是字符串或对象
                let conditionExpr: string | undefined;
                if (element.conditionExpression) {
                    if (typeof element.conditionExpression === 'string') {
                        conditionExpr = element.conditionExpression;
                    } else if (typeof element.conditionExpression === 'object') {
                        // 可能是 { body: "=amount < 10000" } 或类似结构
                        conditionExpr = element.conditionExpression.body || element.conditionExpression._body || String(element.conditionExpression);
                    }
                }

                edges.push({
                    id: element.id,
                    source: element.sourceRef.id,
                    target: element.targetRef.id,
                    conditionExpression: conditionExpr
                });

            } else {

                nodes.push({
                    id: element.id,
                    name: element.name || "",
                    type: element.$type,
                    incoming: (element.incoming || []).map((i: any) => i.id),
                    outgoing: (element.outgoing || []).map((o: any) => o.id)
                });

            }

        }

        const startNodes = nodes
            .filter(n => this.toLowerCase(n.type) === "bpmn:startevent")
            .map(n => n.id);

        const endNodes = nodes
            .filter(n => this.toLowerCase(n.type) === "bpmn:endevent")
            .map(n => n.id);

        const approvalNodes = nodes
            .filter(n =>
                this.toLowerCase(n.type) === "bpmn:usertask" ||
                this.toLowerCase(n.type) === "bpmn:servicetask"
            )
            .map(n => n.id);

        return {
            nodes,
            edges,
            startNodes,
            endNodes,
            approvalNodes
        };
    }

    getNextNodes(graph: BpmnGraph, nodeId: string, variables: Record<string, any> = {}): string[] {
        const outgoingEdges = graph.edges.filter(e => e.source === nodeId);
        
        // 如果只有一条边，直接返回
        if (outgoingEdges.length <= 1) {
            return outgoingEdges.map(e => e.target);
        }
        
        // 有多条边，需要评估条件
        for (const edge of outgoingEdges) {
            if (!edge.conditionExpression) {
                // 没有条件的边（默认边）
                continue;
            }
            
            // 评估条件表达式
            const result = this.evaluateCondition(edge.conditionExpression, variables);
            if (result) {
                return [edge.target];
            }
        }
        
        // 如果没有满足条件，返回默认边（没有条件的边）
        const defaultEdge = outgoingEdges.find(e => !e.conditionExpression);
        if (defaultEdge) {
            return [defaultEdge.target];
        }
        
        // 没有默认边，返回所有
        return outgoingEdges.map(e => e.target);
    }
    
    private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
        try {
            // 移除前导的 "=" 符号
            const expr = condition.startsWith('=') ? condition.substring(1) : condition;
            
            // 替换变量名
            let evalExpr = expr;
            for (const [key, value] of Object.entries(variables)) {
                // 处理变量替换
                const varPattern = new RegExp(`\\b${key}\\b`, 'g');
                if (typeof value === 'string') {
                    evalExpr = evalExpr.replace(varPattern, `'${value}'`);
                } else {
                    evalExpr = evalExpr.replace(varPattern, String(value));
                }
            }
            
            // 使用Function来评估表达式
            // 注意：这是一个简化的实现，生产环境应该使用更安全的表达式解析器
            const result = new Function(`return ${evalExpr}`)();
            return Boolean(result);
        } catch (e) {
            console.error('Failed to evaluate condition:', e);
            return false;
        }
    }

    getPrevNodes(graph: BpmnGraph, nodeId: string): string[] {
        return graph.edges
            .filter(e => e.target === nodeId)
            .map(e => e.source);
    }

    /**
     * 提取所有ServiceTask节点信息
     * 包括：nodeId(节点ID)、name(节点名称)、taskType(任务类型)、role(角色)、assignee(指定人)
     * 
     * BPMN XML结构示例：
     * <bpmn:serviceTask id="Task_Manager" name="部门经理审批">
     *   <bpmn:extensionElements>
     *     <zeebe:taskDefinition type="manager-approval" />
     *     <zeebe:property name="role">部门经理</zeebe:property>
     *     <zeebe:property name="assignee">manager001</zeebe:property>
     *   </bpmn:extensionElements>
     * </bpmn:serviceTask>
     */
    async extractAllTasks(bpmnXml: string): Promise<ServiceTaskInfo[]> {
        const tasks: ServiceTaskInfo[] = [];
        
        // 1. 使用BpmnModdle解析XML
        const { rootElement }: any = await this.moddle.fromXML(bpmnXml);
        
        // 2. 查找bpmn:Process元素
        const process = rootElement.rootElements.find(
            (e: any) => this.toLowerCase(e.$type) === "bpmn:process"
        );
        
        if (!process) {
            return tasks;
        }
        
        // 3. 遍历所有流程元素
        for (const element of process.flowElements) {
            const elementType = this.toLowerCase(element.$type);
            
            // 只处理ServiceTask和UserTask
            if (elementType.includes('servicetask') || elementType.includes('usertask')) {
                let taskType = '';
                let role: string | undefined;
                let assignee: string | undefined;
                
                // 4. 解析extensionElements中的扩展属性
                if (element.extensionElements?.values) {
                    for (const ext of element.extensionElements.values) {
                        const extType = this.toLowerCase(String(ext.$type));
                        
                        // 提取zeebe:taskDefinition的type属性
                        if (extType.includes('taskdefinition')) {
                            taskType = ext.type || '';
                        }
                        
                        // 提取zeebe:property的name和value
                        if (extType.includes('property')) {
                            if (ext.name === 'role') {
                                role = ext.value;
                            }
                            if (ext.name === 'assignee') {
                                assignee = ext.value;
                            }
                        }
                    }
                }
                
                // 只有有taskType的才添加到列表
                if (taskType) {
                    tasks.push({
                        nodeId: element.id,
                        name: element.name || element.id,
                        taskType: taskType,
                        role: role,
                        assignee: assignee
                    });
                }
            }
        }
        
        return tasks;
    }

    async extractServiceTasks(bpmnXml: string): Promise<ServiceTaskInfo[]> {
        return this.extractAllTasks(bpmnXml);
    }

    async extractUserTasks(bpmnXml: string): Promise<ServiceTaskInfo[]> {
        const tasks: ServiceTaskInfo[] = [];
        
        const { rootElement }: any = await this.moddle.fromXML(bpmnXml);
        
        const process = rootElement.rootElements.find(
            (e: any) => this.toLowerCase(e.$type) === "bpmn:process"
        );
        
        if (!process) {
            return tasks;
        }
        
        for (const element of process.flowElements) {
            const elementType = this.toLowerCase(element.$type);
            
            if (elementType.includes('usertask')) {
                let taskType = '';
                
                if (element.extensionElements?.values) {
                    for (const ext of element.extensionElements.values) {
                        const extType = this.toLowerCase(String(ext.$type));
                        if (extType.includes('taskdefinition')) {
                            taskType = ext.type || '';
                            break;
                        }
                    }
                }
                
                tasks.push({
                    nodeId: element.id,
                    name: element.name || element.id,
                    taskType: taskType
                });
            }
        }
        
        return tasks;
    }

    async extractTaskAssignments(bpmnXml: string): Promise<TaskAssignment[]> {
        const assignments: TaskAssignment[] = [];
        
        const { rootElement }: any = await this.moddle.fromXML(bpmnXml);
        
        const process = rootElement.rootElements.find(
            (e: any) => this.toLowerCase(e.$type) === "bpmn:process"
        );
        
        if (!process) {
            return assignments;
        }
        
        for (const element of process.flowElements) {
            const elementType = this.toLowerCase(element.$type);
            
            if (elementType.includes('usertask') || elementType.includes('servicetask')) {
                let taskDefinitionType = '';
                let role: string | undefined;
                let assignee: string | undefined;
                
                if (element.extensionElements?.values) {
                    for (const ext of element.extensionElements.values) {
                        const extType = this.toLowerCase(String(ext.$type));
                        if (extType.includes('taskdefinition')) {
                            taskDefinitionType = ext.type || '';
                        }
                        if (extType.includes('property')) {
                            if (ext.name === 'role') {
                                role = ext.value;
                            }
                            if (ext.name === 'assignee') {
                                assignee = ext.value;
                            }
                        }
                        if (extType.includes('taskheaders')) {
                            const children = ext.$children || ext.headers;
                            if (children && Array.isArray(children)) {
                                for (const header of children) {
                                    if (header.key === 'user') {
                                        assignee = header.value;
                                    }
                                }
                            }
                        }
                    }
                }
                
                assignments.push({
                    nodeId: element.id,
                    role,
                    assignee,
                    taskDefinitionType
                });
            }
        }
        
        return assignments;
    }

    extractTaskAssignmentsSync(bpmnXml: string): TaskAssignment[] {
        return [];
    }

    extractServiceTaskTypes(bpmnXml: string): { nodeId: string; taskType: string }[] {
        return [];
    }

}

export const bpmnParser = new BpmnParser();
