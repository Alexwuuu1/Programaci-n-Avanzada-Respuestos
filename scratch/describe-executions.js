const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all("PRAGMA table_info(execution_entity)", [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('=== execution_entity COLUMNS ===');
  rows.forEach(r => {
    console.log(`- Column: ${r.name} (${r.type})`);
  });
  db.close();
});
