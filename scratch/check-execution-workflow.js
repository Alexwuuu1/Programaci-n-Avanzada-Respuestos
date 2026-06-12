const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT workflowData FROM execution_data WHERE executionId = 190", [], (err, row) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  
  console.log('=== WORKFLOW DATA IN EXECUTION 190 ===');
  const wf = JSON.parse(row.workflowData);
  const switchNode = wf.nodes.find(n => n.name === 'Switch Keyboard Router');
  if (switchNode) {
    console.log(JSON.stringify(switchNode.parameters, null, 2));
  } else {
    console.log('Switch node not found in execution workflowData');
  }
  db.close();
});
