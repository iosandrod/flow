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

async function cleanup() {
  console.log('=== Cleaning up ===');
  await query("DELETE FROM ACT_RU_TASK");
  await query("DELETE FROM ACT_BIZ_APPROVAL");
  console.log('Cleaned!');
}

cleanup().then(() => process.exit(0));
