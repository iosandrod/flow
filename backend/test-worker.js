const mssql = require('mssql');
const { DbAdapt } = require('./dist/db/DbAdapt');
const { DataSource } = require('typeorm');
const { WorkerManager } = require('./dist/engine/WorkerManager');
const { SysUser } = require('./dist/db/entities/SysUser');
const { BizApproval } = require('./dist/db/entities/BizApproval');
const { BizApprovalHistory } = require('./dist/db/entities/BizApprovalHistory');
const { BizFlowDesign } = require('./dist/db/entities/BizFlowDesign');
const { RuTask } = require('./dist/db/entities/RuTask');
const { HiTaskinst } = require('./dist/db/entities/HiTaskinst');
const { RuExecution } = require('./dist/db/entities/RuExecution');

const AppDataSource = new DataSource({
    type: 'mssql',
    host: '114.132.77.46',
    port: 1433,
    username: 'sa',
    password: 'zkaps#1',
    database: 'ZKAPS_001_HeTai',
    synchronize: false,
    logging: false,
    options: {
        trustServerCertificate: true,
        encrypt: false
    },
    entities: [SysUser, BizApproval, BizApprovalHistory, BizFlowDesign, RuTask, HiTaskinst, RuExecution]
});

async function testWorker() {
    await AppDataSource.initialize();
    console.log('Database connected');
    
    const dbAdapt = new DbAdapt(AppDataSource);
    const workerManager = new WorkerManager();
    workerManager.setDbAdapt(dbAdapt);
    
    console.log('Connecting to Zeebe...');
    await workerManager.connect();
    console.log('Connected to Zeebe');
    
    const taskTypes = ['manager-approval', 'boss-approval', 'finance-approval'];
    
    console.log('\n=== Testing worker handling ===');
    await workerManager.handleOrphanedJobs(taskTypes);
    
    // Check if tasks were created
    const tasks = await dbAdapt.getAllPendingTasks();
    console.log('\n=== Tasks in database ===');
    console.log('Total tasks:', tasks.length);
    if (tasks.length > 0) {
        console.log(JSON.stringify(tasks[0], null, 2));
    }
    
    process.exit(0);
}

testWorker().catch(e => {
    console.error(e);
    process.exit(1);
});
