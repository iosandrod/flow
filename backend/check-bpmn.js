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
  console.log('\n=== Checking BPMN flow design ===');
  const bpmn = await query("SELECT TOP 3 * FROM ACT_BIZ_FLOW_DESIGN ORDER BY CREATE_TIME_ DESC");
  console.log('Flow designs:', bpmn.length);
  if (bpmn.length > 0) {
    console.log('Latest BPMN XML preview:', bpmn[0].BPMN_XML_?.substring(0, 500));
  }

  console.log('\n=== Checking ACT_RU_JOB ===');
  const jobs = await query("SELECT TOP 5 * FROM ACT_RU_JOB");
  console.log('Jobs:', jobs.length);
  if (jobs.length > 0) {
    console.log(jobs.map(j => ({ ID: j.ID_, JOB_TYPE_: j.JOB_TYPE_, PROCESS_DEF_KEY: j.PROCESS_DEF_KEY_, ELEMENT_ID: j.ELEMENT_ID_ })));
  }
}

check().then(() => process.exit(0));
