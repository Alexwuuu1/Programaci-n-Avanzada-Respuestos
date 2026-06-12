const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all("SELECT id, workflowId, finished, status, startedAt FROM execution_entity WHERE workflowId='071LfThtq1qeiOIM' ORDER BY id DESC LIMIT 10", [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('=== LATEST TELEGRAM BOT EXECUTIONS ===');
  if (rows.length === 0) {
    console.log('No execution records found. Execution saving might be disabled in n8n for successful runs.');
  } else {
    rows.forEach(r => {
      console.log(`Execution ID: ${r.id} | Status: ${r.status} | Finished: ${r.finished} | Started: ${r.startedAt}`);
    });
  }
  db.close();
});
