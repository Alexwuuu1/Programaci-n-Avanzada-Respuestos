const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all("SELECT id, name, nodes FROM workflow_entity", [], (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  
  console.log('=== SEARCHING FOR INLINE KEYBOARDS ===');
  rows.forEach(row => {
    try {
      const nodes = JSON.parse(row.nodes);
      nodes.forEach(node => {
        if (node.parameters && node.parameters.replyMarkup === 'inlineKeyboard') {
          console.log(`\nFound in Workflow: "${row.name}" (ID: ${row.id})`);
          console.log(`Node Name: "${node.name}"`);
          console.log('Parameters:', JSON.stringify(node.parameters, null, 2));
        }
      });
    } catch (e) {
      // Ignore parse errors
    }
  });
  db.close();
});
