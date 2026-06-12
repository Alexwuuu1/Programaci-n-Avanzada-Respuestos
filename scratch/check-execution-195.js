const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const { parse } = require('/usr/local/lib/node_modules/n8n/node_modules/flatted');

const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get(
  "SELECT executionId, data FROM execution_data ORDER BY executionId DESC LIMIT 1",
  [],
  (err, row) => {
    if (err) {
      console.error(err);
      return;
    }
    const parsed = parse(row.data);
    console.log("Execution ID:", row.executionId);
    const runData = parsed.resultData.runData;
    const inlineNodeRun = runData['Telegram Send (Inline Keyboard)'];
    if (inlineNodeRun) {
      console.log('=== TELEGRAM SEND (INLINE KEYBOARD) ===');
      console.log(JSON.stringify(inlineNodeRun, null, 2));
    } else {
      console.log('Telegram Send (Inline Keyboard) was not run.');
    }
    const webhookRun = runData['HTTP Request Webhook Backend'];
    if (webhookRun) {
      console.log('=== HTTP REQUEST WEBHOOK BACKEND ===');
      console.log(JSON.stringify(webhookRun, null, 2));
    }
    db.close();
  }
);
