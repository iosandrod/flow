const { ZBClient } = require('zeebe-node');

async function checkZeebe() {
  const zb = new ZBClient('localhost:26500');

  try {
    // Get deployed processes
    console.log('=== Deployed Processes ===');
    const deploy = await zb.listDeployments();
    console.log(deploy);

    // Get running process instances
    console.log('\n=== Running Process Instances ===');
    try {
      const processes = await zb.listProcessInstances();
      console.log(processes);
    } catch(e) {
      console.log('No process instances or error:', e.message);
    }

    // Try to get jobs for each task type
    console.log('\n=== Activated Jobs ===');
    const taskTypes = ['manager-approval', 'boss-approval', 'finance-approval'];
    for (const type of taskTypes) {
      try {
        const jobs = await zb.activateJobs({
          maxJobsToActivate: 10,
          timeout: 1000,
          type: type
        });
        console.log(`Jobs for ${type}:`, jobs.length > 0 ? jobs : 'None');
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
