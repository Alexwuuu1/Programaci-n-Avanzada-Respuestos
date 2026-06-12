const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT versionId, activeVersionId, active FROM workflow_entity WHERE id='WgdkC9IHwtTe8gmV'", [], (err, row) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('=== VENTAS WORKFLOW VERSION DETAILS ===');
  console.log('versionId:', row.versionId);
  console.log('activeVersionId:', row.activeVersionId);
  console.log('active:', row.active);
  db.close();
});
