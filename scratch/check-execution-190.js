const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const flatted = require('/usr/local/lib/node_modules/n8n/node_modules/flatted');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all("SELECT executionId, data FROM execution_data WHERE executionId IN (189, 190) ORDER BY executionId DESC", [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  rows.forEach(row => {
    console.log(`\n=========================================`);
    console.log(`EXECUTION ID: ${row.executionId}`);
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
  });
  
  db.close();
});
