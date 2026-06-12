const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.serialize(() => {
  db.get("SELECT COUNT(*) as cnt FROM execution_entity", (err, row) => {
    console.log('Total in execution_entity:', row.cnt);
  });
  db.get("SELECT COUNT(*) as cnt FROM execution_data", (err, row) => {
    console.log('Total in execution_data:', row.cnt);
  });
  db.all("SELECT executionId FROM execution_data ORDER BY executionId DESC LIMIT 5", (err, rows) => {
    console.log('Latest executionIds in execution_data:', rows.map(r => r.executionId));
  });
  db.get("SELECT name, sql FROM sqlite_master WHERE name='execution_data'", (err, row) => {
    console.log('execution_data schema:', row.sql);
  });
});
db.close();
