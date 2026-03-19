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

async function checkBPMN() {
  const bpmn = await query("SELECT TOP 1 BPMN_XML_ FROM ACT_BIZ_FLOW_DESIGN");
  if (bpmn.length > 0) {
    console.log('BPMN XML:\n', bpmn[0].BPMN_XML_);
  }
}

checkBPMN().then(() => process.exit(0));
