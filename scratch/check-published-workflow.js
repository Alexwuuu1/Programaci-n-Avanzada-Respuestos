const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT COUNT(*) as cnt FROM workflow_published_version WHERE workflowId='071LfThtq1qeiOIM'", [], (err, row) => {
  console.log('Count in workflow_published_version:', row?.cnt);
});

db.all("SELECT * FROM workflow_published_version WHERE workflowId='071LfThtq1qeiOIM'", [], (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  if (!rows || rows.length === 0) {
    console.log('No published versions found.');
  } else {
    rows.forEach(r => {
      console.log('Published version:', r.id, 'Created:', r.createdAt);
      // Let's check switch node in published version nodes
      const nodes = JSON.parse(r.nodes);
      const switchNode = nodes.find(n => n.name === 'Switch Keyboard Router');
      if (switchNode) {
        console.log('Switch node rules in published version:', JSON.stringify(switchNode.parameters.rules, null, 2));
      } else {
        console.log('Switch node not found in published version');
      }
    });
  }
  db.close();
});
