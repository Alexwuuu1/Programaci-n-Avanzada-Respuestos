const sqlite3 = require('sqlite3').verbose();

const dbPath = 'C:/Users/Ale/Documents/Proyecto Programacion/n8n_database.sqlite';
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening DB:', err.message);
    process.exit(1);
  }
});

db.get("SELECT name, active, nodes FROM workflow_entity WHERE id='071LfThtq1qeiOIM'", [], (err, row) => {
  if (err) {
    console.error('Error executing query:', err.message);
    db.close();
    process.exit(1);
  }
  if (!row) {
    console.log('No workflow found with ID 071LfThtq1qeiOIM');
  } else {
    console.log('=== ACTIVE WORKFLOW NODES ===');
    const nodes = JSON.parse(row.nodes);
    nodes.forEach(n => {
      console.log(`- Node: "${n.name}" (${n.type})`);
      if (n.name.includes('Inline') || n.name === 'Telegram Send') {
        console.log('  Parameters:', JSON.stringify(n.parameters, null, 2));
      }
    });
  }
  db.close();
});
