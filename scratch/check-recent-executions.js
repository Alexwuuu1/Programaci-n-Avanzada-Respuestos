const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const { parse } = require('/usr/local/lib/node_modules/n8n/node_modules/flatted');

const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all(
  "SELECT executionId, data FROM execution_data ORDER BY executionId DESC LIMIT 2",
  [],
  (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    rows.forEach(row => {
      const parsed = parse(row.data);
      console.log(`\n=== EXECUTION ID: ${row.executionId} ===`);
      const runData = parsed.resultData.runData;
      for (const [nodeName, runs] of Object.entries(runData)) {
        console.log(`- Node: "${nodeName}"`);
        runs.forEach((run, idx) => {
          console.log(`  Run ${idx} Status:`, run.error ? 'ERROR' : 'SUCCESS');
          if (run.error) {
            console.log(`    Error details:`, JSON.stringify(run.error, null, 2));
          }
          if (run.data && run.data.main) {
            run.data.main.forEach((itemArr, itemIdx) => {
              if (itemArr && itemArr[0]) {
                console.log(`    Item ${itemIdx} Output JSON:`, JSON.stringify(itemArr[0].json));
              }
            });
          }
        });
      }
    });
    db.close();
  }
);
