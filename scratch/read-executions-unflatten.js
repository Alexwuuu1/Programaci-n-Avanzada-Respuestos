const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const { parse } = require('/usr/local/lib/node_modules/n8n/node_modules/flatted');

const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get(
  "SELECT executionId, data FROM execution_data ORDER BY executionId DESC LIMIT 1",
  [],
  (err, row) => {
    if (err) {
      console.error("Error fetching execution:", err);
      return;
    }
    if (!row) {
      console.log("No execution found.");
      return;
    }
    try {
      const parsedData = parse(row.data);
      console.log("Execution ID:", row.executionId);
      
      const runData = parsedData.resultData.runData;
      console.log("Nodes involved:", Object.keys(runData));
      
      const telegramSendRun = runData['Telegram Send'];
      if (telegramSendRun) {
        console.log("\n--- Telegram Send Node Run Data ---");
        telegramSendRun.forEach((run, idx) => {
          console.log(`\nRun ${idx}:`);
          if (run.data && Array.isArray(run.data.main)) {
            run.data.main.forEach((itemArray, itemArrIdx) => {
              if (Array.isArray(itemArray)) {
                itemArray.forEach((item, itemIdx) => {
                  console.log(`  Sub-Item ${itemIdx}:`);
                  console.log("    JSON Response from Telegram:", JSON.stringify(item.json, null, 2));
                  if (item.input) {
                    console.log("    Input parameters passed to Node:", JSON.stringify(item.input, null, 2));
                  } else {
                    console.log("    No input parameters logged in this item.");
                  }
                });
              } else {
                console.log(`  Item ${itemArrIdx} is not an array:`, typeof itemArray);
              }
            });
          }
        });
      } else {


        console.log("Telegram Send node was not executed in this run.");
      }
    } catch (e) {
      console.error("Error parsing/processing data:", e);
    }
  }
);
