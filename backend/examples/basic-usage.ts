/**
 * flowable-backend 使用示例
 * 
 * 这个文件展示了如何在其他项目中集成 flowable-backend
 */

import { DataSource } from 'typeorm';
import { FlowManager } from './src/manager/FlowManager';
import { WorkerManager } from './src/engine/WorkerManager';
import { DbAdapt } from './src/db/DbAdapt';

// 示例1: 使用 MSSQL 数据库
async function exampleWithMSSQL() {
  // 1. 创建数据库连接
  const AppDataSource = new DataSource({
    type: 'mssql',
    host: 'localhost',
    port: 1433,
    username: 'sa',
    password: 'your-password',
    database: 'YourDatabase',
    synchronize: false,
    logging: false,
    options: { trustServerCertificate: true, encrypt: false },
    entities: [__dirname + '/dist/db/entities/*.js']
  });

  await AppDataSource.initialize();
  console.log('数据库连接成功');

  // 2. 创建数据库适配器
  const dbAdapt = new DbAdapt(AppDataSource);

  // 3. 创建流程管理器
  const flowManager = new FlowManager(dbAdapt);

  // 4. 创建 Worker 管理器
  const workerManager = new WorkerManager();
  workerManager.setDbAdapt(dbAdapt);
  await workerManager.connect();

  // 5. 获取流程列表
  const flowDesigns = await dbAdapt.listFlowDesigns();
  console.log('流程设计列表:', flowDesigns);

  // 6. 解析 BPMN 获取任务类型
  // const { bpmnParser } = require('./dist/utils/BpmnParser');
  // const tasks = await bpmnParser.extractAllTasks(bpmnXml);

  // 7. 发起审批流程
  // const result = await flowManager.startWorkflow({
  //   bpmnKey: 'your-flow-key',
  //   starterId: 'user-001',
  //   businessKey: 'biz-001',
  //   processName: '审批流程',
  //   variables: { amount: 5000, reason: '测试' }
  // });

  // 8. 审批任务
  // await flowManager.approveTask(taskId, userId, '同意');

  // 关闭连接
  await AppDataSource.destroy();
}

// 示例2: 使用 PostgreSQL
async function exampleWithPostgres() {
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'your-password',
    database: 'yourdb',
    synchronize: false,
    entities: [__dirname + '/dist/db/entities/*.js']
  });

  await AppDataSource.initialize();
  // ... 后续代码同上
}

// 示例3: 创建 Worker 监听特定任务类型
async function exampleWithWorker() {
  // 配置 Worker 监听
  const workerManager = new WorkerManager('localhost:26500');
  
  // 设置数据库适配器
  // workerManager.setDbAdapt(dbAdapt);
  
  // 连接到 Zeebe
  await workerManager.connect();
  
  // 创建 Worker 监听任务类型
  workerManager.createWorkerForTaskType('manager-approval', 'flow');
  workerManager.createWorkerForTaskType('finance-approval', 'flow');
  
  console.log('Worker 已启动');
}

// 示例4: 手动控制流程
async function exampleManual() {
  // 1. 获取待办任务
  // const tasks = await dbAdapt.getUserTasks('user-id');
  
  // 2. 完成审批
  // await workerManager.completePendingTask(taskId, 'user-001', '同意', { amount: 5000 });
  
  // 3. 获取审批历史
  // const history = await dbAdapt.getApprovalHistory(approvalId);
}

// 运行示例
if (require.main === module) {
  console.log('运行示例...');
  // exampleWithMSSQL().catch(console.error);
}

export { exampleWithMSSQL, exampleWithPostgres, exampleWithWorker, exampleManual };
