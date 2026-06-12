const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all("SELECT id, name, active FROM workflow_entity", [], (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('=== WORKFLOWS IN DB ===');
  rows.forEach(r => {
    console.log(`- ID: ${r.id} | Name: ${r.name} | Active: ${r.active}`);
  });
  db.close();
});
