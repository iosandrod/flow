const mssql = require('mssql');
const { ZBClient } = require('zeebe-node');

const config = {
  server: '114.132.77.46',
  port: 1433,
  user: 'sa',
  password: 'zkaps#1',
  database: 'ZKAPS_001_HeTai',
  options: { trustServerCertificate: true, encrypt: false }
};

const zeebeConfig = {
  gatewayAddress: 'localhost:26500'
};

async function main() {
  console.log('=== 测试 Zeebe Worker 监听 ===\n');

  const pool = await mssql.connect(config);
  
  // 1. 获取 BPMN XML
  console.log('1. 获取 BPMN XML...');
  const flowResult = await pool.query("SELECT * FROM ACT_BIZ_FLOW_DESIGN WHERE ID_ = 'flow'");
  const flowDesign = flowResult.recordset[0];
  console.log('   流程:', flowDesign.ID_, flowDesign.NAME_);
  
  // 2. 解析 BPMN 获取任务类型
  console.log('\n2. 解析 BPMN 获取任务类型...');
  const { BpmnParser } = require('./dist/utils/BpmnParser');
  const bpmnParser = new BpmnParser();
  const tasks = await bpmnParser.extractAllTasks(flowDesign.BPMN_XML_);
  console.log('   任务类型:', tasks.map(t => t.taskType).join(', '));
  
  // 3. 部署流程
  console.log('\n3. 部署流程到 Zeebe...');
  const zc = new ZBClient(zeebeConfig);
  const deploy = await zc.deployResource({
    name: 'test-approval.bpmn',
    process: Buffer.from(flowDesign.BPMN_XML_, 'utf-8')
  });
  console.log('   部署成功:', deploy.deployments?.[0]?.process?.bpmnProcessId);
  
  // 4. 创建审批实例
  console.log('\n4. 创建审批实例...');
  const approvalId = 'test-' + Date.now();
  const instance = await zc.createProcessInstance({
    bpmnProcessId: 'approval-process',
    variables: {
      amount: 5000,
      applicant: '测试用户',
      reason: '测试原因',
      approvalId: approvalId,
      businessKey: 'test-business'
    }
  });
  console.log('   实例ID:', instance.processInstanceKey);
  
  // 保存审批记录到数据库
  console.log('\n5. 保存审批记录到数据库...');
  await pool.query(`INSERT INTO ACT_BIZ_APPROVAL (ID_, PROC_INST_ID_, BUSINESS_TYPE_, TITLE_, APPLICANT_, STATUS_, CREATE_TIME_, FORM_DATA_)
    VALUES ('${approvalId}', '${instance.processInstanceKey}', 'flow', '测试审批', '测试用户', 'I', GETDATE(), '{"amount":5000,"applicant":"测试用户","reason":"测试原因"}')`);
  console.log('   审批记录已保存');
  
  // 6. 创建 Worker 监听任务
  console.log('\n6. 创建 Worker 监听任务...\n');
  
  const workers = [];
  
  for (const taskType of tasks.map(t => t.taskType)) {
    console.log(`   启动 Worker 监听: ${taskType}`);
    
    const worker = zc.createWorker({
      taskType: taskType,
      taskHandler: async (job) => {
        console.log(`\n   [收到任务] ${taskType}`);
        console.log('   Job Key:', job.key);
        console.log('   Element:', job.elementId);
        console.log('   Variables:', JSON.stringify(job.variables));
        
        // 获取任务分配信息
        const assignments = await bpmnParser.extractTaskAssignments(flowDesign.BPMN_XML_);
        const assignment = assignments.find(a => a.nodeId === job.elementId);
        console.log('   Assignee:', assignment?.assignee || '无');
        
        // 模拟审批通过
        const approvedVars = {
          ...job.variables,
          _approvedBy: assignment?.assignee || 'admin',
          _approved: true
        };
        
        console.log(`   [完成任务] ${taskType}`);
        return job.complete(approvedVars);
      }
    });
    
    workers.push(worker);
  }
  
  console.log('\n   所有 Worker 已启动，等待任务...\n');
  
  // 等待一段时间让 Worker 处理任务
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  // 7. 检查结果
  console.log('\n8. 检查数据库...');
  const taskResult = await pool.query('SELECT ID_, TASK_DEF_KEY_, NAME_, ASSIGNEE_, APPROVAL_USER_ FROM ACT_RU_TASK');
  console.log('\n   任务列表:');
  for (const task of taskResult.recordset) {
    console.log(`   - ${task.NAME_} (${task.TASK_DEF_KEY_})`);
    console.log('     ASSIGNEE:', task.ASSIGNEE_);
    console.log('     APPROVAL_USER:', task.APPROVAL_USER_);
  }
  
  const approvalResult = await pool.query(`SELECT * FROM ACT_BIZ_APPROVAL WHERE ID_ = '${approvalId}'`);
  console.log('\n   审批状态:', approvalResult.recordset[0]?.STATUS_);
  
  // 8. 清理
  console.log('\n9. 清理...');
  for (const worker of workers) {
    worker.close();
  }
  await pool.close();
  await zc.close();
  
  console.log('\n=== 测试完成 ===');
}

main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
