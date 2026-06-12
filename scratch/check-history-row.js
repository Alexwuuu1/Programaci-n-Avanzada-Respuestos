const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT nodes FROM workflow_history WHERE versionId='8b583c50-2319-4bc2-b308-272c9d4fce5e'", [], (err, row) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  if (row) {
    console.log('Found history row for 8b583c50-2319-4bc2-b308-272c9d4fce5e!');
    const nodes = JSON.parse(row.nodes);
    const switchNode = nodes.find(n => n.name === 'Switch Keyboard Router');
    if (switchNode) {
      console.log('Switch node rules in this history record:', JSON.stringify(switchNode.parameters.rules, null, 2));
    }
  } else {
    console.log('No history row found for 8b583c50-2319-4bc2-b308-272c9d4fce5e');
  }
  db.close();
});
