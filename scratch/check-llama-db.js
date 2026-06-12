const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'n8n_database.sqlite');
console.log('Connecting to db:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.all("SELECT id, name, active, nodes FROM workflow_entity", [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log(`Found ${rows.length} workflows.`);
    rows.forEach((row) => {
      if (row.nodes.includes('llama3.1')) {
        console.log(`Workflow: ${row.name} (ID: ${row.id}) contains "llama3.1"`);
      }
    });
    db.close();
  });
});
