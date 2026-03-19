const { ZBClient } = require('zeebe-node');

async function testZeebe() {
  const zb = new ZBClient('localhost:26500', {
    pollInterval: 500,
    connectionTolerance: 5000
  });

  try {
    console.log('Trying to connect to Zeebe...');
    const topology = await zb.topology();
    console.log('Connected to Zeebe!');
    console.log('Cluster topology:', JSON.stringify(topology, null, 2));
    
    // Check deployed processes
    const deploys = await zb.listDeployments();
    console.log('Deployed processes:', JSON.stringify(deploys, null, 2));
    
  } catch (error) {
    console.error('Zeebe connection error:', error.message);
  }
  
  process.exit(0);
}

testZeebe();
