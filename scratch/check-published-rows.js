const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all("SELECT * FROM workflow_published_version", [], (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('=== workflow_published_version ROWS ===');
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
