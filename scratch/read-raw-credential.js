const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT data FROM credentials_entity WHERE id='79bkQTmHvuA9yJYT';", [], (err, row) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('=== RAW TELEGRAM CREDENTIAL DATA ===');
  console.log(row.data);
  db.close();
});
