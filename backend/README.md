# flowable-backend

工作流审批引擎 - 支持 BPMN 流程定义、Zeebe 引擎集成、动态任务分配

## 特性

- 🚀 **BPMN 2.0 支持** - 完整的 BPMN 流程解析和执行
- ⚡ **Zeebe 集成** - 基于 Camunda Zeebe 引擎的任务处理
- 👥 **动态任务分配** - 支持按用户、角色分配任务
- 🔄 **条件路由** - 支持网关条件判断
- 📊 **审批历史** - 完整的审批记录追踪
- 🗄️ **多数据库支持** - MSSQL、PostgreSQL、MySQL、SQLite

## 安装

```bash
npm install flowable-backend
```

## 快速开始

```typescript
import { DataSource } from 'typeorm';
import { FlowManager } from 'flowable-backend';

// 1. 创建数据库连接
const AppDataSource = new DataSource({
  type: 'mssql',
  host: 'localhost',
  port: 1433,
  username: 'sa',
  password: 'your-password',
  database: 'YourDatabase',
  synchronize: false,
  entities: [require.resolve('flowable-backend/dist/db/entities/*.js')]
});

await AppDataSource.initialize();

// 2. 创建核心组件
const dbAdapt = new DbAdapt(AppDataSource);
const flowManager = new FlowManager(dbAdapt);

// 3. 发起审批流程
const result = await flowManager.startWorkflow({
  bpmnKey: 'approval-process',
  starterId: 'user-001',
  businessKey: 'biz-001',
  processName: '审批流程',
  variables: {
    amount: 5000,
    reason: '采购办公设备'
  }
});

console.log('流程已启动:', result);
```

## API

### FlowManager

流程管理核心类

```typescript
// 发起流程
await flowManager.startWorkflow(bpmnKey, starterId, businessKey, processName, variables);

// 审批任务
await flowManager.approveTask(taskId, userId, comment, variables);

// 拒绝任务
await flowManager.rejectTask(taskId, userId, comment);

// 获取用户待办
const tasks = await flowManager.getUserTasks(userId, roleName);

// 获取流程详情
const detail = await flowManager.getProcessDetail(processId);
```

### WorkerManager

任务 Worker 管理器

```typescript
// 连接到 Zeebe
await workerManager.connect();

// 创建 Worker 监听任务类型
workerManager.createWorkerForTaskType('manager-approval', 'processKey');

// 完成审批任务
await workerManager.completePendingTask(taskId, userId, comment, variables);

// 获取待办任务
const pendingTask = workerManager.getPendingTask(taskId);
```

### BpmnParser

BPMN 解析器

```typescript
import { bpmnParser } from 'flowable-backend';

// 解析 BPMN XML
const graph = await bpmnParser.parse(bpmnXml);

// 获取所有任务节点
const tasks = await bpmnParser.extractAllTasks(bpmnXml);

// 获取任务分配信息
const assignments = await bpmnParser.extractTaskAssignments(bpmnXml);

// 获取下一个节点（考虑条件）
const nextNodes = bpmnParser.getNextNodes(graph, currentNodeId, variables);
```

## BPMN 配置

### 任务类型定义

```xml
<bpmn:serviceTask id="Task_Manager" name="部门经理审批">
  <bpmn:extensionElements>
    <zeebe:taskDefinition type="manager-approval" />
    <zeebe:taskHeaders>
      <zeebe:header key="user" value="admin" />
    </zeebe:taskHeaders>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

- `zeebe:taskDefinition type` - 任务类型标识
- `zeebe:header key="user"` - 审批人

### 网关条件

```xml
<bpmn:sequenceFlow id="flow_normal" sourceRef="Gateway_Amount" targetRef="Task_Finance">
  <bpmn:conditionExpression>=amount &lt; 10000</bpmn:conditionExpression>
</bpmn:sequenceFlow>
```

## 数据库实体

- `ACT_BIZ_APPROVAL` - 审批记录
- `ACT_BIZ_APPROVAL_HISTORY` - 审批历史
- `ACT_BIZ_FLOW_DESIGN` - 流程设计
- `ACT_RU_TASK` - 待办任务
- `ACT_RU_EXECUTION` - 流程执行
- `ACT_RU_VARIABLE` - 流程变量

## 依赖

- Node.js >= 16.0.0
- TypeORM >= 0.3.0
- Zeebe 8.x (可选，用于分布式任务处理)

## License

MIT
