const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const fs = require('fs');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all("SELECT id, name FROM workflow_entity", [], (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  
  const mapping = {};
  rows.forEach(r => {
    let normalized = r.name.toLowerCase()
      .replace(/ - /g, '-')
      .replace(/ /g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    // Manual overrides to match exact existing file names in repository
    if (r.id === '071LfThtq1qeiOIM') normalized = 'repuestos-telegram-buttons';
    else if (r.id === '6uUR40g9Wq5Q5022') normalized = 'repuestos-router';
    
    mapping[r.id] = normalized;
  });
  
  console.log('Generated workflow mapping.');
  fs.writeFileSync('/home/node/workflows-export/mapping.json', JSON.stringify(mapping, null, 2));
  db.close();
});
