const sqlite3 = require('sqlite3').verbose();

const dbPath = 'C:/Users/Ale/Documents/Proyecto Programacion/n8n_database.sqlite';
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening DB:', err.message);
    process.exit(1);
  }
});

console.log('=== LATEST EXECUTIONS ===');
db.all("SELECT id, status, startedAt, stoppedAt, workflowId, errorInfo FROM execution_entity ORDER BY startedAt DESC LIMIT 10", [], (err, rows) => {
  if (err) {
    console.error('Error querying executions:', err.message);
    db.close();
    process.exit(1);
  }
  if (rows.length === 0) {
    console.log('No executions found.');
  } else {
    rows.forEach(r => {
      console.log(`ID: ${r.id} | Status: ${r.status} | Workflow: ${r.workflowId} | Started: ${r.startedAt}`);
      if (r.errorInfo) {
        console.log('  Error Info:', r.errorInfo);
      }
    });
  }
  db.close();
});
