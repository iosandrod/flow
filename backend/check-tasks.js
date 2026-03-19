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

async function check() {
  console.log('\n=== All tasks in ACT_RU_TASK ===');
  const tasks = await query("SELECT * FROM ACT_RU_TASK ORDER BY START_TIME_ DESC");
  console.log('Total:', tasks.length);
  if (tasks.length > 0) {
    console.log('Latest task:', JSON.stringify(tasks[0], null, 2));
  }
  
  console.log('\n=== All tasks with NULL END_TIME ===');
  const activeTasks = await query("SELECT * FROM ACT_RU_TASK WHERE END_TIME_ IS NULL");
  console.log('Active tasks:', activeTasks.length);
}

check().then(() => process.exit(0));
