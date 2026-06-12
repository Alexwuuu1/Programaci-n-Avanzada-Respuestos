const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT name, active, nodes FROM workflow_entity WHERE id='071LfThtq1qeiOIM'", [], (err, row) => {
  if (err) {
    console.error('Error executing query:', err.message);
    process.exit(1);
  }
  if (!row) {
    console.log('No workflow found with ID 071LfThtq1qeiOIM');
  } else {
    console.log('=== ACTIVE WORKFLOW NODES ===');
    console.log('Workflow Name:', row.name);
    console.log('Active:', row.active);
    const nodes = JSON.parse(row.nodes);
    nodes.forEach(n => {
      console.log(`- Node: "${n.name}" (${n.type})`);
      if (n.name.includes('Inline') || n.name.includes('Telegram') || n.type.includes('telegram')) {
        console.log('  Parameters:', JSON.stringify(n.parameters, null, 2));
      }
    });
  }
  db.close();
});
