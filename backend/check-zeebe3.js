const { ZBClient } = require('zeebe-node');

async function checkZeebe() {
  const zb = new ZBClient('localhost:26500');

  try {
    // Get topology first
    console.log('=== Zeebe Topology ===');
    const topology = await zb.topology();
    console.log('Gateway version:', topology.gatewayVersion);
    console.log('Cluster size:', topology.clusterSize);

    // Get process instances
    console.log('\n=== Running Process Instances ===');
    try {
      const processes = await zb._grpc.workflow.ProcessInstanceService.list({});
      console.log(JSON.stringify(processes, null, 2));
    } catch(e) {
      console.log('Error getting process instances:', e.message);
    }

    // Try to get jobs using the correct API
    console.log('\n=== Jobs in Zeebe ===');
    const taskTypes = ['manager-approval', 'boss-approval', 'finance-approval'];
    for (const type of taskTypes) {
      try {
        const jobs = await zb.activateJobs({
          maxJobsToActivate: 10,
          timeout: 1000,
          type: type
        });
        if (jobs && jobs.length > 0) {
          console.log(`Jobs for ${type}:`, JSON.stringify(jobs, null, 2));
        } else {
          console.log(`Jobs for ${type}: None available`);
        }
      } catch(e) {
        console.log(`Jobs for ${type}: Error -`, e.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

checkZeebe();
