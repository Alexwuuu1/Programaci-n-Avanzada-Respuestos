const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const flatted = require('/usr/local/lib/node_modules/n8n/node_modules/flatted');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT data FROM execution_data WHERE executionId = 190", [], (err, row) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const decoded = flatted.parse(row.data);
  console.log('=== DECODED EXECUTION DATA KEYS ===');
  console.log(Object.keys(decoded));
  
  // Let's search inside decoded for anything related to switch parameters
  // e.g. decoded.executionData
  if (decoded.executionData) {
    console.log('executionData keys:', Object.keys(decoded.executionData));
  }
  
  // Let's print the nodeExecutionStack to see what n8n recorded
  console.log('nodeExecutionStack:', JSON.stringify(decoded.nodeExecutionStack, null, 2));
  
  db.close();
});
