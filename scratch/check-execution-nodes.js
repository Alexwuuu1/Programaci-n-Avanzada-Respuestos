const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

// Query last 5 executions
db.all("SELECT executionId, data FROM execution_data ORDER BY executionId DESC LIMIT 5", [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  rows.forEach(row => {
    console.log(`\n=========================================`);
    console.log(`EXECUTION ID: ${row.executionId}`);
    try {
      const data = JSON.parse(row.data);
      
      // Let's decode the compressed/indexed n8n execution data format
      // In n8n executionData, we have node names and their execution data.
      // Let's print the structure
      const nodeExecutionData = data.resultData?.runData;
      if (nodeExecutionData) {
        console.log('Executed Nodes:');
        for (const nodeName of Object.keys(nodeExecutionData)) {
          const nodeRuns = nodeExecutionData[nodeName];
          console.log(`- Node: "${nodeName}"`);
          nodeRuns.forEach((run, index) => {
            console.log(`  Run ${index}:`);
            if (run.data && run.data.main) {
              run.data.main.forEach((item, itemIdx) => {
                console.log(`    Item ${itemIdx} Input:`, JSON.stringify(item[0]?.json || {}));
              });
            }
          });
        }
      } else {
        // Fallback: print raw keys
        console.log('Keys in data:', Object.keys(data));
        if (data.executionData) {
          console.log('ExecutionData nodeExecutionStack:', data.executionData.nodeExecutionStack);
        }
      }
    } catch (e) {
      console.log('Error parsing data:', e.message);
      console.log('Raw data snippet:', row.data.slice(0, 500));
    }
  });
  
  db.close();
});
