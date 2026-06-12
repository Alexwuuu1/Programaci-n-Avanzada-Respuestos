const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const flatted = require('/usr/local/lib/node_modules/n8n/node_modules/flatted');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

const execId = process.argv[2] ? parseInt(process.argv[2], 10) : 190;

db.get("SELECT executionId, data FROM execution_data WHERE executionId = ?", [execId], (err, row) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  if (!row) {
    console.log(`Execution ${execId} not found in execution_data`);
    process.exit(0);
  }
  
  console.log(`=== DECODING EXECUTION ID: ${row.executionId} ===`);
  try {
    const decoded = flatted.parse(row.data);
    const runData = decoded.resultData?.runData;
    if (runData) {
      for (const [nodeName, runs] of Object.entries(runData)) {
        console.log(`- Node: "${nodeName}"`);
        runs.forEach((run, idx) => {
          console.log(`  Run ${idx} Status:`, run.error ? 'ERROR' : 'SUCCESS');
          if (run.data && run.data.main) {
            run.data.main.forEach((itemArr, itemIdx) => {
              if (itemArr && itemArr[0]) {
                console.log(`    Item ${itemIdx} Output JSON:`, JSON.stringify(itemArr[0].json));
              } else {
                console.log(`    Item ${itemIdx} Output: EMPTY`);
              }
            });
          }
        });
      }
    }
  } catch (e) {
    console.error('Decoding error:', e);
  }
  db.close();
});
