const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT nodes FROM workflow_entity WHERE id='071LfThtq1qeiOIM'", [], (err, row) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const nodes = JSON.parse(row.nodes);
  const telegramNode = nodes.find(n => n.name === 'Telegram Send (Inline Keyboard)');
  console.log('=== TELEGRAM SEND (INLINE KEYBOARD) IN DATABASE ===');
  console.log(JSON.stringify(telegramNode, null, 2));
  db.close();
});
