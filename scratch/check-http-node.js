const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT nodes FROM workflow_entity WHERE id='071LfThtq1qeiOIM'", [], (err, row) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  const nodes = JSON.parse(row.nodes);
  const httpNode = nodes.find(n => n.name.includes('HTTP Request') || n.name.includes('Backend') || n.id === 'http-webhook-backend');
  if (httpNode) {
    console.log('=== HTTP Request Node Parameters ===');
    console.log(JSON.stringify(httpNode.parameters, null, 2));
  } else {
    console.log('HTTP request node not found');
  }
  db.close();
});
