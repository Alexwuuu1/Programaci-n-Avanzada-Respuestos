const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const flatted = require('/usr/local/lib/node_modules/n8n/node_modules/flatted');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT data FROM execution_data WHERE executionId = 190", [], (err, row) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const decoded = flatted.parse(row.data);
  const switchRun = decoded.resultData?.runData["Switch Keyboard Router"];
  console.log('=== RAW SWITCH RUN DATA ===');
  console.log(JSON.stringify(switchRun, null, 2));
  db.close();
});
