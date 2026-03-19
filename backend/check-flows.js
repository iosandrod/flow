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
  const flows = await query("SELECT * FROM ACT_BIZ_FLOW_DESIGN");
  console.log('Flow designs:', JSON.stringify(flows, null, 2));
}

check().then(() => process.exit(0));
