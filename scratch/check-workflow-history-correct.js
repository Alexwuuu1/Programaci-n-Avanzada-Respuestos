const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all("SELECT workflowId, versionId FROM workflow_history WHERE workflowId='071LfThtq1qeiOIM' LIMIT 5", [], (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  if (!rows || rows.length === 0) {
    console.log('No history versions found.');
  } else {
    rows.forEach((r, idx) => {
      console.log(`History entry ${idx}: workflowId: ${r.workflowId}, versionId: ${r.versionId}`);
    });
  }
  db.close();
});
