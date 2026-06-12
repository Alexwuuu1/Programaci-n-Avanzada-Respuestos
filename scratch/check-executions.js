const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all("SELECT id, workflowId, status, startedAt, stoppedAt, errorDetails FROM execution_entity ORDER BY id DESC LIMIT 5", [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('=== LATEST EXECUTIONS ===');
  rows.forEach(r => {
    console.log(`Execution ID: ${r.id} | Workflow: ${r.workflowId} | Status: ${r.status} | Started: ${r.startedAt}`);
    if (r.errorDetails) {
      console.log('  Error Details:', r.errorDetails);
    }
  });
  db.close();
});
