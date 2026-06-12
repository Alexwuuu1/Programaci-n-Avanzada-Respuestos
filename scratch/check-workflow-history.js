const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT COUNT(*) as cnt FROM workflow_history WHERE workflowId='071LfThtq1qeiOIM'", [], (err, row) => {
  console.log('Count in workflow_history:', row?.cnt);
});

db.all("SELECT id, workflowId, versionId, createdAt FROM workflow_history WHERE workflowId='071LfThtq1qeiOIM' ORDER BY createdAt DESC LIMIT 5", [], (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  if (!rows || rows.length === 0) {
    console.log('No history versions found.');
  } else {
    rows.forEach(r => {
      console.log('History version:', r.id, 'versionId:', r.versionId, 'Created:', r.createdAt);
    });
  }
  db.close();
});
