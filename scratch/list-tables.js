const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('=== n8n DB TABLES ===');
  rows.forEach(r => {
    console.log(`- ${r.name}`);
  });
  db.close();
});
