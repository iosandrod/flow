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

async function query(sql) {
  try {
    const pool = await mssql.connect(config);
    const result = await pool.query(sql);
    await pool.close();
    return result.recordset;
  } catch (err) {
    console.error('Query error:', err.message);
    return [];
  }
}

async function checkTables() {
  console.log('\n=== Checking ACT_BIZ_APPROVAL table ===');
  const approvals = await query("SELECT TOP 5 * FROM ACT_BIZ_APPROVAL ORDER BY CREATE_TIME_ DESC");
  console.log('ACT_BIZ_APPROVAL rows:', approvals.length);
  if (approvals.length > 0) {
    console.log('Latest record:', JSON.stringify(approvals[0], null, 2));
  }

  console.log('\n=== Checking ACT_RU_TASK table ===');
  const tasks = await query("SELECT TOP 5 * FROM ACT_RU_TASK ORDER BY START_TIME_ DESC");
  console.log('ACT_RU_TASK rows:', tasks.length);
  if (tasks.length > 0) {
    console.log('Latest record:', JSON.stringify(tasks[0], null, 2));
  }

  console.log('\n=== Checking ACT_RU_EXECUTION table ===');
  const executions = await query("SELECT TOP 5 * FROM ACT_RU_EXECUTION");
  console.log('ACT_RU_EXECUTION rows:', executions.length);
  if (executions.length > 0) {
    console.log('Records:', executions.map(e => ({ ID: e.ID_, PROC_DEF_KEY: e.PROC_DEF_KEY_, ACT_ID: e.ACT_ID_, IS_ACTIVE_: e.IS_ACTIVE_ })));
  }
}

checkTables().then(() => process.exit(0));
