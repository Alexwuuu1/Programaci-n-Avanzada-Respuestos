const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all("SELECT * FROM settings", [], (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(rows);
  db.close();
});
