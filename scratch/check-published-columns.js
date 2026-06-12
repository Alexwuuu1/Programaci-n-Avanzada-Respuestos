const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT name, sql FROM sqlite_master WHERE name='workflow_published_version'", (err, row) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('=== workflow_published_version SCHEMA ===');
  console.log(row.sql);
  db.close();
});
