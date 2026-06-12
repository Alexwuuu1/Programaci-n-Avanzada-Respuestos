const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT * FROM workflow_entity WHERE id='071LfThtq1qeiOIM'", [], (err, row) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('=== WORKFLOW ENTITY COLUMNS & VALUES ===');
  for (const [key, val] of Object.entries(row)) {
    if (key === 'nodes' || key === 'connections') {
      console.log(`- Column: ${key} (length: ${val.length} chars)`);
    } else {
      console.log(`- Column: ${key} = ${val}`);
    }
  }
  db.close();
});
