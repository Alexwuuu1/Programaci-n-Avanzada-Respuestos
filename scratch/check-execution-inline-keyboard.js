const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const flatted = require('/usr/local/lib/node_modules/n8n/node_modules/flatted');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT data FROM execution_data WHERE executionId = 192", [], (err, row) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const decoded = flatted.parse(row.data);
  const telegramRun = decoded.resultData?.runData["Telegram Send (Inline Keyboard)"];
  console.log('=== TELEGRAM RUN DATA ===');
  console.log(JSON.stringify(telegramRun, null, 2));
  db.close();
});
