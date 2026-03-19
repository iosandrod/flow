const http = require('http');
const mssql = require('mssql');

const config = {
  server: '114.132.77.46',
  port: 1433,
  user: 'sa',
  password: 'zkaps#1',
  database: 'ZKAPS_001_HeTai',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

const API_URL = 'http://localhost:3000';

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

async function callApi(action, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ action, data });
    log('API请求: ' + postData.substring(0, 200));
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/workflow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ success: false, message: body });
        }
      });
    });
    
    req.on('error', (err) => {
      log('API错误: ' + err.message);
      reject(err);
    });
    req.write(postData);
    req.end();
  });
}

async function query(sql) {
  const pool = await mssql.connect(config);
  const result = await pool.query(sql);
  await pool.close();
  return result.recordset;
}

async function cleanup() {
  log('清理数据库...');
  await query("DELETE FROM ACT_RU_TASK");
  await query("DELETE FROM ACT_BIZ_APPROVAL");
  await query("DELETE FROM ACT_RU_JOB");
  log('清理完成');
}

async function startWorkflow() {
  log('步骤1: 发起审批流程（金额5000）');
  const result = await callApi('start', {
    bpmnKey: 'flow',
    starterId: '1',
    businessKey: 'test_' + Date.now(),
    processName: '审批流程',
    variables: {
      amount: 5000,
      applicant: '测试用户',
      reason: '测试原因',
      _starterName: '系统管理员'
    }
  });
  
  log('API响应: ' + JSON.stringify(result));
  
  if (!result.success) {
    throw new Error('发起流程失败: ' + result.message);
  }
  
  log(`流程发起成功: ${result.data.approvalId}`);
  
  // 等待Worker创建任务
  await new Promise(r => setTimeout(r, 3000));
  
  return result.data;
}

async function verifyStep2() {
  log('步骤2: 验证数据库（ACT_RU_TASK=1, ACT_BIZ_APPROVAL=1）');
  const tasks = await query('SELECT * FROM ACT_RU_TASK');
  const approvals = await query('SELECT * FROM ACT_BIZ_APPROVAL');
  
  log(`ACT_RU_TASK: ${tasks.length} 条记录`);
  log(`ACT_BIZ_APPROVAL: ${approvals.length} 条记录`);
  
  if (tasks.length !== 1) {
    throw new Error(`ACT_RU_TASK应有1条记录，实际${tasks.length}条`);
  }
  if (approvals.length !== 1) {
    throw new Error(`ACT_BIZ_APPROVAL应有1条记录，实际${approvals.length}条`);
  }
  
  log('✅ 步骤2验证通过');
  return tasks[0];
}

async function adminApprove(taskId) {
  log('步骤3: admin审批通过');
  const result = await callApi('approve', {
    taskId: taskId,
    userId: '1',
    comment: '同意'
  });
  
  if (!result.success) {
    throw new Error('审批失败: ' + result.message);
  }
  
  log('admin审批完成');
  
  // 等待任务创建
  await new Promise(r => setTimeout(r, 2000));
}

async function verifyStep4() {
  log('步骤4: 验证数据库（ACT_RU_TASK=2, ACT_BIZ_APPROVAL=1）');
  const tasks = await query('SELECT * FROM ACT_RU_TASK');
  const approvals = await query('SELECT * FROM ACT_BIZ_APPROVAL');
  
  log(`ACT_RU_TASK: ${tasks.length} 条记录`);
  log(`ACT_BIZ_APPROVAL: ${approvals.length} 条记录`);
  
  if (tasks.length !== 2) {
    throw new Error(`ACT_RU_TASK应有2条记录，实际${tasks.length}条`);
  }
  if (approvals.length !== 1) {
    throw new Error(`ACT_BIZ_APPROVAL应有1条记录，实际${approvals.length}条`);
  }
  
  log('✅ 步骤4验证通过');
  return tasks;
}

async function verifyStep5(tasks) {
  log('步骤5: 验证有APPROVAL_USER_=19828395638的记录');
  
  const xuTask = tasks.find(t => t.APPROVAL_USER_ === '19828395638');
  
  if (!xuTask) {
    throw new Error('没有找到APPROVAL_USER_=19828395638的记录');
  }
  
  log(`✅ 找到徐菊芬的任务: ${xuTask.ID_}`);
  return xuTask;
}

async function xuJufenApprove(taskId) {
  log('步骤6: 徐菊芬审批通过');
  const result = await callApi('approve', {
    taskId: taskId,
    userId: '41',
    comment: '同意'
  });
  
  if (!result.success) {
    throw new Error('审批失败: ' + result.message);
  }
  
  log('徐菊芬审批完成');
  await new Promise(r => setTimeout(r, 1000));
}

async function verifyComplete() {
  log('步骤7: 验证流程完成');
  const approvals = await query('SELECT * FROM ACT_BIZ_APPROVAL');
  
  if (approvals.length !== 1) {
    throw new Error(`ACT_BIZ_APPROVAL应有1条记录，实际${approvals.length}条`);
  }
  
  const approval = approvals[0];
  log(`流程状态: ${approval.STATUS_}`);
  
  if (approval.STATUS_ === 'F') {
    log('✅ 流程已完成');
  } else {
    log(`⚠️ 流程状态: ${approval.STATUS_}`);
  }
}

async function runTest() {
  const MAX_RETRIES = 3;
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    try {
      log(`========== 测试尝试 ${retryCount + 1}/${MAX_RETRIES} ==========`);
      
      // 清理数据库
      await cleanup();
      
      // 等待清理完成
      await new Promise(r => setTimeout(r, 1000));
      
      // 步骤1: 发起审批
      const workflow = await startWorkflow();
      
      // 步骤2: 验证
      await verifyStep2();
      
      // 获取admin的任务ID
      const adminTask = (await query("SELECT * FROM ACT_RU_TASK WHERE APPROVAL_USER_ = 'admin'"))[0];
      if (!adminTask) {
        throw new Error('未找到admin的任务');
      }
      
      // 步骤3: admin审批通过
      await adminApprove(adminTask.ID_);
      
      // 步骤4: 验证
      const tasks = await verifyStep4();
      
      // 步骤5: 验证有徐菊芬的任务
      const xuTask = await verifyStep5(tasks);
      
      // 步骤6: 徐菊芬审批通过
      await xuJufenApprove(xuTask.ID_);
      
      // 步骤7: 验证完成
      await verifyComplete();
      
      log('========== 🎉 所有测试通过！ ==========');
      return;
      
    } catch (error) {
      retryCount++;
      log(`❌ 测试失败: ${error.message}`);
      
      if (retryCount < MAX_RETRIES) {
        log(`将在3秒后重试...`);
        await new Promise(r => setTimeout(r, 3000));
      } else {
        log('========== 测试失败，已达最大重试次数 ==========');
        process.exit(1);
      }
    }
  }
}

runTest().catch(err => {
  console.error('测试异常:', err);
  process.exit(1);
});
