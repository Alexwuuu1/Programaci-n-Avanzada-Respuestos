const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT name, connections FROM workflow_entity WHERE id='071LfThtq1qeiOIM'", [], (err, row) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('=== Connections for:', row.name, '===');
  const connections = JSON.parse(row.connections);
  console.log(JSON.stringify(connections, null, 2));
  db.close();
});
