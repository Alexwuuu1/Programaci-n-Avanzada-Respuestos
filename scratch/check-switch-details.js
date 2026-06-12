const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT nodes FROM workflow_entity WHERE id='071LfThtq1qeiOIM'", [], (err, row) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  const nodes = JSON.parse(row.nodes);
  const switchNode = nodes.find(n => n.name === 'Switch Keyboard Router');
  if (switchNode) {
    console.log('=== Switch Keyboard Router Full Parameters ===');
    console.log(JSON.stringify(switchNode, null, 2));
  } else {
    console.log('Switch node not found');
  }
  db.close();
});
