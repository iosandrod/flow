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
  console.log('\n=== Listing all tables ===');
  const tables = await query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
  console.log('Tables:', tables.map(t => t.TABLE_NAME).join('\n'));
}

checkTables().then(() => process.exit(0));
